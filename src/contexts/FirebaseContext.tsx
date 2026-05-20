/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firestore-utils';
import { 
  UserProfile, 
  Course, 
  OperationType, 
  AppState 
} from '../types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  state: AppState;
  createInitialUser: (user: User) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  completeCourse: (course: Course, nextCourseId: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    profile: null,
    currentCourse: null,
    courseHistory: [],
    isLoading: true
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const coursesRef = collection(db, 'users', user.uid, 'courses');
    const coursesQuery = query(coursesRef, orderBy('courseNumber', 'desc'));

    setLoading(true);

    const unsubscribeUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        setState(prev => ({ ...prev, profile }));
        
        if (profile.currentCourseId) {
          const currentCourseRef = doc(db, 'users', user.uid, 'courses', profile.currentCourseId);
          getDoc(currentCourseRef).then(courseSnap => {
            if (courseSnap.exists()) {
              setState(prev => ({ ...prev, currentCourse: courseSnap.data() as Course }));
            }
          }).finally(() => {
            setState(prev => ({ ...prev, isLoading: false }));
            setLoading(false);
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
          setLoading(false);
        }
      } else {
        // User doc doesn't exist yet
        console.log("No user profile found, waiting for creation...");
        setState(prev => ({ ...prev, isLoading: false }));
        setLoading(false);
      }
    }, (err) => {
      console.error('User listener error:', err);
      setState(prev => ({ ...prev, isLoading: false }));
      setLoading(false);
    });

    const unsubscribeCourses = onSnapshot(coursesQuery, (snap) => {
      const allCourses = snap.docs.map(d => d.data() as Course);
      const history = allCourses.filter(c => c.isCompleted);
      const current = allCourses.find(c => !c.isCompleted);
      
      setState(prev => ({ 
        ...prev, 
        courseHistory: history,
        currentCourse: current || prev.currentCourse,
        isLoading: false
      }));
      setLoading(false);
    }, (err) => {
      console.error('Courses listener error:', err);
      setState(prev => ({ ...prev, isLoading: false }));
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeCourses();
    };
  }, [user]);

  const createInitialUser = async (u: User) => {
    const userRef = doc(db, 'users', u.uid);
    const courseId = crypto.randomUUID();
    const initialCourse: Course = {
      id: courseId,
      courseNumber: 1,
      startDate: new Date().toISOString(),
      sessions: [],
      isCompleted: false,
      updatedAt: new Date().toISOString()
    };

    const initialProfile: UserProfile = {
      id: u.uid,
      email: u.email || '',
      currentCourseId: courseId,
      totalFees: 0,
      updatedAt: new Date().toISOString()
    };

    try {
      const batch = [
        setDoc(userRef, { ...initialProfile, updatedAt: serverTimestamp() }),
        setDoc(doc(db, 'users', u.uid, 'courses', courseId), { ...initialCourse, updatedAt: serverTimestamp() })
      ];
      await Promise.all(batch);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`);
    }
  };

  const updateCourse = async (course: Course) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'courses', course.id), {
        ...course,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/courses/${course.id}`);
    }
  };

  const completeCourse = async (course: Course, nextCourseId: string) => {
    if (!user || !state.profile) return;
    
    const nextCourse: Course = {
      id: nextCourseId,
      courseNumber: course.courseNumber + 1,
      startDate: new Date().toISOString(),
      sessions: [],
      isCompleted: false,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Update completed course
      await setDoc(doc(db, 'users', user.uid, 'courses', course.id), {
        ...course,
        isCompleted: true,
        completionDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      // 2. Create next course
      await setDoc(doc(db, 'users', user.uid, 'courses', nextCourseId), {
        ...nextCourse,
        updatedAt: serverTimestamp()
      });

      // 3. Update user profile to new course
      await setDoc(doc(db, 'users', user.uid), {
        ...state.profile,
        currentCourseId: nextCourseId,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      state, 
      createInitialUser, 
      updateCourse, 
      completeCourse,
      updateProfile
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
