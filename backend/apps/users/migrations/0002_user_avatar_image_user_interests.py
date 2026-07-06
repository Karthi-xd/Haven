# Generated manually (equivalent to `manage.py makemigrations users`)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='avatar_image',
            field=models.FileField(blank=True, null=True, upload_to='avatars/%Y/%m/'),
        ),
        migrations.AddField(
            model_name='user',
            name='interests',
            field=models.CharField(blank=True, max_length=300),
        ),
    ]
