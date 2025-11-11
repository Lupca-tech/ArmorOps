
import React, { useState, useEffect } from 'react';
import { Translation, Language } from '../../translations';
import firebase from 'firebase/compat/app';
import { db } from '../../services/firebase';

interface AccountActivityPageProps {
    T: Translation;
    user: firebase.User;
    lang: Language;
}

interface ActivityLog {
    id: string;
    timestamp: firebase.firestore.Timestamp;
    type: string;
    userAgent: string;
}

const AccountActivityPage: React.FC<AccountActivityPageProps> = ({ T, user, lang }) => {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = db.collection(`users/${user.uid}/activityLog`)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
                setActivities(logs);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching activity logs:", error);
                setIsLoading(false);
            });

        return () => unsubscribe();
    }, [user.uid]);

    const groupActivitiesByDate = (logs: ActivityLog[]) => {
        return logs.reduce((acc, log) => {
            const date = log.timestamp.toDate().toLocaleDateString(lang, {
                year: 'numeric',
                month: 'long',
            });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {} as Record<string, ActivityLog[]>);
    };

    const groupedActivities = groupActivitiesByDate(activities);
    
    const translateActivityType = (type: string) => {
        if (type === 'logged in with email') return T.loggedInWithEmail;
        if (type === 'logged in via Google') return T.loggedInViaGoogle;
        return type;
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">{T.accountActivityTitle}</h2>
            
            <div className="bg-gray-950 rounded-lg border border-gray-800">
                {isLoading ? (
                     <div className="p-6 text-center text-gray-400">{T.loadingActivity}</div>
                ) : Object.keys(groupedActivities).length === 0 ? (
                    <div className="p-6 text-center text-gray-400">{T.noActivityFound}</div>
                ) : (
                    Object.entries(groupedActivities).map(([date, logs]) => (
                        <div key={date} className="p-6 border-b border-gray-800 last:border-b-0">
                            <h3 className="text-lg font-semibold mb-4">{date}</h3>
                            <ul className="space-y-4">
                                {logs.map(log => (
                                    <li key={log.id} className="flex items-center gap-4">
                                         {user.photoURL ? (
                                            <img src={user.photoURL} alt="User avatar" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <span className="h-8 w-8 flex items-center justify-center bg-gray-800 rounded-full text-sm font-semibold">
                                                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <div className="text-sm">
                                            <p className="text-gray-200">
                                                <span className="font-semibold">{T.you}</span> {translateActivityType(log.type)}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {log.timestamp.toDate().toLocaleString(lang)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
export default AccountActivityPage;