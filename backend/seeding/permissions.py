permissions = {
    "student": {
        "course": ["Can view course"],
        "feedback": ["Can add feedback", "Can change feedback", "Can view feedback"],
        "tag": ["Can view tag"],
        "topic": ["Can view topic"],
        "lesson": ["Can view lesson"],
        "courseenrollment": ["Can add course enrollment", "Can view course enrollment"],
        "user": ["Can view user"],
    },
    "teacher": {
        "course": ["Can add course", "Can change course", "Can view course"],
        "feedback": ["Can view feedback"],
        "tag": ["Can add tag", "Can change tag", "Can view tag"],
        "topic": [
            "Can add topic",
            "Can change topic",
            "Can delete topic",
            "Can view topic",
        ],
        "lesson": [
            "Can add lesson",
            "Can change lesson",
            "Can delete lesson",
            "Can view lesson",
        ],
        "user": ["Can view user"],
        "courseenrollment": ["Can change course enrollment"],
    },
}
