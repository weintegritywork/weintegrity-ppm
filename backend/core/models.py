from django.db import models


class Team(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    name = models.CharField(max_length=200)
    leadId = models.CharField(max_length=64)
    memberIds = models.JSONField(default=list)
    projectId = models.CharField(max_length=64, blank=True, null=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    STATUS_CHOICES = (
        ('Not Started', 'Not Started'),
        ('In Progress', 'In Progress'),
        ('On Hold', 'On Hold'),
        ('Completed', 'Completed'),
    )
    id = models.CharField(primary_key=True, max_length=64)
    name = models.CharField(max_length=200)
    ownerId = models.CharField(max_length=64)
    startDate = models.CharField(max_length=30)
    endDate = models.CharField(max_length=30)
    description = models.TextField()
    memberIds = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    def __str__(self):
        return self.name


class Epic(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    name = models.CharField(max_length=200)
    projectId = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class Sprint(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    name = models.CharField(max_length=200)
    projectId = models.CharField(max_length=64)
    startDate = models.CharField(max_length=30)
    endDate = models.CharField(max_length=30)

    def __str__(self):
        return self.name


class Story(models.Model):
    STATE_CHOICES = (
        ('Draft', 'Draft'),
        ('Ready', 'Ready'),
        ('In Progress', 'In Progress'),
        ('Test', 'Test'),
        ('Done', 'Done'),
        ('Blocked', 'Blocked'),
    )
    PRIORITY_CHOICES = (
        ('1 - Critical', '1 - Critical'),
        ('2 - High', '2 - High'),
        ('3 - Moderate', '3 - Moderate'),
        ('4 - Low', '4 - Low'),
    )
    TYPE_CHOICES = (
        ('Feature', 'Feature'),
        ('Defect', 'Defect'),
        ('Enhancement', 'Enhancement'),
    )

    id = models.CharField(primary_key=True, max_length=64)
    number = models.CharField(max_length=50)
    shortDescription = models.CharField(max_length=300)
    description = models.TextField()
    acceptanceCriteria = models.TextField(blank=True, null=True)
    state = models.CharField(max_length=20, choices=STATE_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    storyPoints = models.IntegerField(blank=True, null=True)

    assignedTeamId = models.CharField(max_length=64, blank=True, null=True)
    assignedToId = models.CharField(max_length=64, blank=True, null=True)
    businessOwnerId = models.CharField(max_length=64, blank=True, null=True)
    testedById = models.CharField(max_length=64, blank=True, null=True)

    projectId = models.CharField(max_length=64)
    epicId = models.CharField(max_length=64, blank=True, null=True)
    sprintId = models.CharField(max_length=64, blank=True, null=True)
    release = models.CharField(max_length=64, blank=True, null=True)

    plannedStartDate = models.CharField(max_length=30, blank=True, null=True)
    plannedEndDate = models.CharField(max_length=30, blank=True, null=True)
    actualStartDate = models.CharField(max_length=30, blank=True, null=True)
    actualEndDate = models.CharField(max_length=30, blank=True, null=True)
    progress = models.IntegerField(blank=True, null=True)
    deadline = models.CharField(max_length=30, blank=True, null=True)

    workNotes = models.TextField(blank=True, null=True)
    attachments = models.JSONField(blank=True, null=True)
    relatedStoryIds = models.JSONField(default=list, blank=True, null=True)

    createdById = models.CharField(max_length=64)
    createdOn = models.CharField(max_length=30)
    updatedById = models.CharField(max_length=64)
    updatedOn = models.CharField(max_length=30)


class Notification(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    userId = models.CharField(max_length=64)
    message = models.TextField()
    link = models.CharField(max_length=300)
    isRead = models.BooleanField(default=False)
    timestamp = models.CharField(max_length=30)


class ChatMessage(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    authorId = models.CharField(max_length=64)
    timestamp = models.CharField(max_length=30)
    text = models.TextField()
    attachment = models.JSONField(blank=True, null=True)


class StoryChat(models.Model):
    storyId = models.CharField(max_length=64, unique=True)
    messages = models.JSONField(default=list)


class ProjectChat(models.Model):
    projectId = models.CharField(max_length=64, unique=True)
    messages = models.JSONField(default=list)
