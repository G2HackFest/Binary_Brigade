# This file would contain database models if we were using a database
# For this version, we're using session storage instead of a database
# but keeping this file for future extensibility

class Roadmap:
    """Class for representing a learning roadmap"""
    def __init__(self, title, description, milestones, resources, experience_level, topics, timeframe):
        self.title = title
        self.description = description
        self.milestones = milestones
        self.resources = resources
        self.experience_level = experience_level
        self.topics = topics
        self.timeframe = timeframe

class Milestone:
    """Class for representing a roadmap milestone"""
    def __init__(self, id, title, description, estimated_time, resources):
        self.id = id
        self.title = title
        self.description = description
        self.estimated_time = estimated_time
        self.resources = resources
        self.completed = False

class Resource:
    """Class for representing a learning resource"""
    def __init__(self, title, url, type, description):
        self.title = title
        self.url = url
        self.type = type  # e.g., "article", "video", "course"
        self.description = description