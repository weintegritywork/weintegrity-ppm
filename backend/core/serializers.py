from rest_framework import serializers
from .models import User, Team, Project, Story, Epic, Sprint, Notification, StoryChat, ProjectChat


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ('is_active', 'is_staff', 'last_login', 'groups', 'user_permissions')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'


class StorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = '__all__'


class EpicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Epic
        fields = '__all__'


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class StoryChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryChat
        fields = '__all__'


class ProjectChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectChat
        fields = '__all__'


