"""Crea il gruppo Collaboratori Esterni e il Workflow Approvazione Staff."""
from django.db import migrations


def create_groups_and_workflow(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Workflow = apps.get_model("wagtailcore", "Workflow")
    GroupApprovalTask = apps.get_model("wagtailcore", "GroupApprovalTask")
    WorkflowTask = apps.get_model("wagtailcore", "WorkflowTask")
    ContentType = apps.get_model("contenttypes", "ContentType")

    # Crea gruppi
    Group.objects.get_or_create(name="Collaboratori Esterni")
    staff_group, _ = Group.objects.get_or_create(name="Staff")

    # Crea workflow
    workflow, _ = Workflow.objects.get_or_create(
        name="Approvazione Staff",
        defaults={"active": True},
    )

    # Content type necessario per Wagtail 7.x Task (polimorfismo)
    ct, _ = ContentType.objects.get_or_create(
        app_label="wagtailcore",
        model="groupapprovaltask",
    )

    # Crea task di approvazione
    task, created = GroupApprovalTask.objects.get_or_create(
        name="Revisione Staff",
        defaults={"active": True, "content_type": ct},
    )
    if created:
        task.groups.add(staff_group)

    # Collega task al workflow
    WorkflowTask.objects.get_or_create(
        workflow=workflow,
        task=task,
        defaults={"sort_order": 0},
    )


def reverse_func(apps, schema_editor):
    Workflow = apps.get_model("wagtailcore", "Workflow")
    Workflow.objects.filter(name="Approvazione Staff").delete()
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name__in=["Collaboratori Esterni", "Staff"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        ("wagtailcore", "0093_uploadedfile"),
    ]

    operations = [
        migrations.RunPython(create_groups_and_workflow, reverse_func),
    ]
