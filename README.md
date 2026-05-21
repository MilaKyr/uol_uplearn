## Uplearn - e-learning platform

### Video walkthrough
[![Video walkthrough](/imgs/video_snapshot.png)](https://www.youtube.com/watch?v=4KMxYImokcQ "Uplearn platofrm")

The e-learning platform (Uplean) has separate backend and front-end applications. Backend was
build with Django platform, whereas for the front-end the Next.js platform was used. To run the
application, one should start the backend and front-end separately. The Makefile was created to ease
with the process.

Backend. 
```commandline
make backend
```
Frontend. There 2 options to run frontend:
- with docker:
```commandline
make docker-frontend
```
- without docker:
```commandline
make frontend
```
The frontend is pre-built already, however it can be build with command ```$ npm run build```
Make sure to be in the directory `frontend/elearning`

### Database
The data is stored in SQLite database for the local deployment. It consists of three databases:
elearning, notifications and chat.
Elearning database consists tables regarding: users, courses, topics and lessons, course progress and
course enrollments. All conversations and messages are stored in chat database, and notification
database stores notifications.

![ERD](/imgs/erd.png)

### Backend
There are three applications in the project: elearning, chat and notifications.

### Frontend
Next.js was selected as a front-end framework as it is based on React with additional logic already
implemented. To speed up the frontend development the Mantine UI kit was used. There are few
pages on the frontend that are constructed using the Mantine’s AppShell component. It creates the
Header-Navbar-Footer-Aside layout. Those pages are: home, edit, and study. Furthermore, due to
the composite nature of home page, to discover user’s pages the additional page users was created.
It displays the public profile of the user, whereas home page is regarded as a control panel where
user can access different resources from.

### Authentication
The authentication between frontend and backend is possible with JWTAuthentication. During the
request, the Django Rest Framework looks for header with ‘Authorization’ key. The token is
defined as Bearer <token>. Token is issued per user, once the user is authenticated, its token in
saved on the frontend in the local storage, and used with every communication with the API.

### Notifications
There are two mechanisms to notify teachers about enrollment and students about course updates.
First, the Django signals were used to track the creation CourseEnrollment. Once the new instance
is created in the database, the post_save signal is triggered. It then creates the new notification
according to the information from new enrollment instance.
The created signals are:
- `post_save` for CourseEnrollment and Lessons
- `post_delete` for Lessons and Topic model instances
Additionally, there are two signals created for Notification and Message models each. Once new
instances are created, the message is sent through websocket in the channel created for each user.
![Notification process](/imgs/uplearn-notification2.png)

#### Notification websocket
Routing for the websocket is `http://<host>/ws/notify?token=<token>`, where to establish
connection the user must provide token, given them during authentication. By this token, in the
TokenAuthMiddleware the user is inserted into the scope, and thus authenticated. In the consumer,
the channel is created by taking the user from the scope, and establishing a channel with their
unique ID.
![Process for updating seen notificaions and messages](/imgs/uplearn-notification1.png)

#### Consumer
The notification consumer receives two types of events: information that the notification was seen
(when user specifically closes push notification), and event that the new notification is received. If
the notification is present in the data, it changes its seen field to true. However, consumer has also
two methods: `new_message` and `new_notification`. The `new_message` is used when the user is
a receiver of the new message. It is important to note, that no events are send to the consumer if the
recipient of the message is someone else.
The same process follows when the new notification is created. The event is sent to the
`new_notification` method on the channel established with recipient of this notification, and then it
is sent to the client.

### Chat
Chat is implemented using websocket and Django channels. The channel group is created with the
conversation ID, it broadcasts messages to both users. On the front-end the messages are displayed
according to the client. The implementation uses Redis database to handle multiple websocket
applications. Locally, SQLite database stores the conversations and sent messages, production uses
Postgresql instead. Chat implements the same logic to mark the messages as seen as notifications,
with additionally marking them seen through API endpoint `/api/conversations/<str:conversation_id>/seen`.
The receiver function in the Chat consumer is able to receive two type of messages. It checks if the
message ID is present in the data, and if so, updates the message seen field to true. Otherwise, it
sends the message to the users in the conversation room.
Token authorization
During the connection with the channel the token is sent in the query parameter. Once its reaches
Django, the Authentication middleware separates the path from the token. Based on the token it
tries to find the user, and if it succeeded, the user is added to the scope. Thus, only logged in users
can access the channel.

### Block/Remove students
The teacher can block or remove students from accessing the course. Once the student is blocked,
they receive the notification about their CourseEnrollment status changed, which informs them of
one of the three possibilities:
- Teacher <first_name> <last_name> blocked you from the course <course title>
- Teacher <first_name> <last_name> removed you from the course <course title>
- Teacher <first_name> <last_name> un-blocked you from the course <course title>
![Student list with first two students blocked](/imgs/remove_students.png)

### Student and Teacher Groups
Each use during registration is assigned a group. There are two possible groups: teacher and a
student.
Teachers can perform following actions (the list of actions is set in `/seeding/permissions.py`):
- add, change and view course
- view feedback
- add, change and view tag
- add, change, delete and view topic
- add, change, delete and view lesson
- view user
- change course enrollment

Student can perform following actions:
- view course
- add, change and view feedback
- view tag
- view topic
- view lesson
- view user
- add and view course enrollment
During user registration the permissions are assigned by adding the user to the appropriate group.
Using groups helps reduce code repetition, as each group has its own set of permissions and
everybody in the group has all permissions defined in the group.