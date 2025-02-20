
export interface CourseStudentHomeData {
  enrolled: string;
  id: number;
  photo: string;
  progress: number;
  status: string;
  title: string;
}

export interface StudentProfileData extends BasicUserData {
  status: string;
}

export interface SearchedUserData extends BasicUserData {
  status?: string;
  role: string;
}

export interface CourseDetail extends CourseListData {
  is_owner: boolean;
  enrolled?: boolean;
  description: string;
  topics: TopicStudyData[];
  feedback: CourseFeedbackData[];
  
}

export interface CourseEditData extends CourseListData {
  description: string;
  topics: TopicStudyData[];
  is_active: boolean;
}

export interface UserSettingsData {
  id: number;
  photo: string | undefined;
  first_name: string;
  last_name: string;
  role: string;
  status?: string;
  bio?: string;
  email: string;
  onClick: (photo: string) => void;
}

export interface BasicUserData {
  id: number | undefined;
  photo: string | undefined,
  first_name: string | undefined;
  last_name: string | undefined;
}

interface BasicCourseData {
  id: number | undefined;
  photo: string | undefined,
  title: string | undefined;
}

export interface FeedbackData {
  id: number;
  rating: number;
  course: BasicCourseData;
  text: string;
  created: string;
}


export interface CourseFeedbackData {
  id: number;
  rating: number;
  course: BasicCourseData;
  text: string;
  created: string;
  user: BasicUserData;
}

export interface TodoData {
  course_id: number;
  course_title: string;
  deadline: string;
  id: number;
  title: string;
  topic_id: number;
  topic_title: string;
}

export interface CourseTitle {
  id: number;
  title: string;
}

export interface UserProfile {
  id: number;
  photo: string | undefined,
  first_name: string;
  last_name: string;
  role: string;
  status: string | undefined;
  bio: string | undefined;
}

export interface HomeData {
  id: number;
  photo: string | undefined,
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  status?: string;
  bio?: string;
  todo: TodoData[];
  courses: Course[];
}

export interface UserGuestData {
  id: number;
  photo: string | undefined,
  first_name: string;
  last_name: string;
  role: string;
  is_online: boolean;
  status: string | undefined;
  bio: string | undefined;
  courses: Course[];
}

export interface NotificationData {
  id: number;
  seen: boolean;
  person: BasicUserData;
  course: BasicCourseData;
  text: string;

}
export interface StudentHomeData {
  id: number;
  photo: string | undefined,
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  status: string | undefined;
  todo: TodoData[];
  courses: CourseStudentHomeData[];
}

export interface StudentDashboardData {
  course_id: number;
  course_title: string;
  deadline: string;
  id: number;
  title: string;
  topic_id: number;
  topic_title: string;
}

export interface UserNavbarProps {
  id: number | undefined;
  photo: string | undefined;
  role: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  selected: string;
  onClick: (label: string) => void;
  setLoading: (toSet: boolean) => void;
}

export interface ConversationUserData extends BasicUserData {
  status: string;
  is_online: boolean;
}


export interface ConversationData {
  id: number;
  users: ConversationUserData[];
  messages: Message[];
  unread_messages_ids: number[];
  unread_messages: number;
  last_message: Message;
}

export interface MessagesNavBarProps {
  selected: string;
  chatOwnerId: number;
  onClick: (id: number) => void;
}

export interface ConversationWindowProps {
  conversation: ConversationData;
  myId: number;
  token: string | undefined;
  messages: Message[];
}


export interface Message {
  id: number;
  recipient: ConversationUserData;
  sender: ConversationUserData;
  text: string;
  conversationId: number;
  created?: string;
}

export type Course = {
  id: number;
  title: string;
  tag: string;
  average_rating: number;
  n_students: number,
  photo: string;
  start_date: Date;
  duration: string;
  registered_students: BasicUserData[];
}

export type CourseEdit = {
  id: number;
  title: string;
  tags: TagData[];
  is_active: boolean;
  description: string;
  photo: string;
  start_date: Date;
  duration: string;
}

export interface LessonProps {
  id: number;
  title: string;
  html: string;
}

export interface LessonStudyData extends LessonData {
  html: string;
  done: boolean;
}

export interface LessonEditData extends LessonData {
  html: string;
}

export interface LessonData {
  id: number;
  title: string;
  deadline: string;

}

export interface TopicStudyData {
  id: number;
  title: string;
  n_hours: number;
  lessons: LessonStudyData[];
}

export interface TopicProps {
  id: number;
  title: string;
  n_hours: number;
  lessons: LessonData[];
}

export interface TagData {
  id: number;
  name: string;
  color: string;
}

interface TeacherBasicData {
  id: number;
  first_name: string;
  last_name: string;
  photo: string;
}

export interface CourseListData {
    id: number;
    title: string;
    photo: string;
    tags: TagData[];
    start_date: string;
    duration: string;
    average_rating: number;
    n_students: number;
    teacher: TeacherBasicData;
}