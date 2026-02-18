"""Widget personalizzati per l'admin Wagtail."""

from django import forms
from django.utils.safestring import mark_safe


class IconPickerWidget(forms.TextInput):
    """Selettore visuale di icone Lucide per l'admin Wagtail."""

    class Media:
        css = {"all": ("core/css/icon-picker.css",)}
        js = ("core/js/icon-picker.js",)

    def render(self, name, value, attrs=None, renderer=None):
        attrs = attrs or {}
        attrs["class"] = (attrs.get("class", "") + " icon-picker-input").strip()
        attrs["data-icon-picker"] = "true"
        attrs["autocomplete"] = "off"
        text_input = super().render(name, value, attrs)

        value = value or ""
        preview_html = ""
        if value:
            preview_html = (
                f'<img src="https://unpkg.com/lucide-static@latest/icons/{value}.svg"'
                f' alt="{value}" class="icon-picker-preview-img" />'
                f'<span class="icon-picker-preview-name">{value}</span>'
            )

        html = f"""
        <div class="icon-picker-wrapper">
            <div class="icon-picker-field">
                {text_input}
                <div class="icon-picker-preview">{preview_html}</div>
                <button type="button" class="icon-picker-btn">Scegli icona</button>
                <button type="button" class="icon-picker-clear-btn" title="Rimuovi icona">&times;</button>
            </div>
            <div class="icon-picker-dropdown" style="display:none">
                <input type="text" class="icon-picker-search"
                       placeholder="Cerca icona…" autocomplete="off" />
                <div class="icon-picker-grid"></div>
            </div>
        </div>
        """
        return mark_safe(html)
