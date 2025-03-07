
import { KeyedMutator } from "swr";

export interface CourseStudentHomeData {
  enrolled: string;
  id: string;
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
}

export interface Auth {
  token: {
    access: string;
  },
  user: {
    id: string;
    name: string;
    role: string;
    is_online: boolean;
  }
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

export interface UserSettingsProps {
  userId: string;
}

export interface UserSettingsData {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  status?: string;
  bio?: string;
  onClick: (photo: string) => void;
}

export interface BasicUserData {
  id: string;
  photo: string | undefined,
  name: string;
  role: string;
}

interface BasicCourseData {
  id: string | undefined;
  photo: string | undefined,
  title: string | undefined;
}

export interface FeedbackData {
  feedback: {
    id: string;
    rating: number;
    text: string;
    created: string;
  }
  course: BasicCourseData;
}


export interface CourseFeedbackData {
  id: string;
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
  id: string;
  title: string;
  topic_id: number;
  topic_title: string;
}

export interface CourseTitle {
  id: string;
  title: string;
}

export interface UserProfile {
  id: string;
  photo: string | undefined,
  name: string;
  role: string;
  status: string | undefined;
  bio: string | undefined;
}

export interface HomeData {
  id: string;
  photo: string,
  name: string;
  role: string;
  email: string;
  status?: string;
  bio?: string;
  todo: TodoData[];
  courses: Course[];
}

export interface UserGuestData {
  id: string;
  photo: string | undefined,
  name: string;
  role: string;
  is_online: boolean;
  status: string | undefined;
  bio: string | undefined;
  courses: Course[];
}

export interface NotificationData {
  id: string;
  seen: boolean;
  person: BasicUserData;
  course: BasicCourseData;
  text: string;
  created: string;

}
export interface StudentHomeData {
  id: string;
  photo: string | undefined,
  name: string;
  role: string;
  email: string;
  status: string;
  todo: TodoData[];
  courses: CourseStudentHomeData[];
}

export interface StudentDashboardData {
  course_id: number;
  course_title: string;
  deadline: string;
  id: string;
  title: string;
  topic_id: number;
  topic_title: string;
}

export interface UserNavbarProps {
  id: string;
  photo: string;
  role: string;
  name: string;
  selected: string;
  onClick: (label: string) => void;
  mutate: KeyedMutator<Promise<Response>>;
}

export interface ConversationUserData extends BasicUserData {
  status: string;
  is_online: boolean;
}


export interface ConversationData {
  id: string;
  users: ConversationUserData[];
  messages: Message[];
  unread_messages_ids: number[];
  unread_messages: number;
  last_message: Message;
}

export interface MessagesNavBarProps {
  selected: string;
  chatOwnerId: string;
  onClick: (id: string) => void;
}

export interface ConversationWindowProps {
  conversation: ConversationData;
  myId: string;
  token: string | undefined;
  messages: Message[];
}


export interface Message {
  id: string;
  recipient: ConversationUserData;
  sender: ConversationUserData;
  text: string;
  conversationId: string;
  created?: string;
}

export type Course = {
  id: string;
  title: string;
  tag: string;
  is_active?: boolean;
  average_rating?: number;
  n_students?: number,
  photo: string;
  start_date?: Date;
  duration?: string;
  registered_students?: BasicUserData[];
  enrolled?: string;
  progress?: number;
  status?: string;
}

export type CourseEdit = {
  id: string;
  title: string;
  tags: TagData[];
  is_active: boolean;
  description: string;
  photo: string;
  start_date: Date;
  duration: string;
}

export interface LessonProps {
  id: string;
  title: string;
  html: string;
}

export interface LessonStudyData extends LessonData {
  html: string;
  done: boolean;
}

export interface LessonEditData extends LessonData {
  html: string;
  topic_id: string;
}

export interface LessonData {
  id: string;
  title: string;
  deadline: string;

}

export interface TopicStudyData {
  id: string;
  title: string;
  n_hours: number;
  description: string;
  lessons: LessonStudyData[];
}

export interface TopicProps {
  id: string;
  courseId: number;
  title: string;
  n_hours: number;
  description: string;
  lessons: LessonData[];
}

export interface TagData {
  id: number;
  name: string;
  color: string;
}

interface TeacherBasicData {
  id: number;
  name: string;
  photo: string;
}

export interface CourseListData {
    id: string;
    title: string;
    photo: string;
    tags: TagData[];
    start_date: string;
    duration: string;
    average_rating: number;
    n_students: number;
    teacher: TeacherBasicData;
}