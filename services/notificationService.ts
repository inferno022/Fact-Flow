// Push Notification Service for Fact Flow
// Handles local notifications and engagement reminders

// Notification messages for re-engagement
const MISS_YOU_MESSAGES = [
  "Your brain misses learning! Come back for your daily dose of knowledge.",
  "We've got fresh facts waiting for you! Don't let curiosity fade.",
  "Your streak is at risk! Keep the momentum going.",
  "New mind-blowing facts just dropped. Your brain will thank you!",
  "Skip the doom scroll. Learn something amazing instead!",
  "3 minutes of facts > 30 minutes of mindless scrolling.",
  "Your future self will thank you for learning today.",
  "Knowledge compounds. Every fact makes you smarter!",
];

// Get random message
const getRandomMessage = (messages: string[]) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show local notification
export const showLocalNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: icon || '/logo.png',
      badge: '/logo.png',
      tag: 'fact-flow-notification',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
};

// Schedule daily reminder notification
export const scheduleDailyReminder = () => {
  const lastActive = localStorage.getItem('fact-last-active');
  const now = Date.now();
  
  if (lastActive) {
    const hoursSinceActive = (now - parseInt(lastActive)) / (1000 * 60 * 60);
    
    // Show notification if inactive for 24+ hours
    if (hoursSinceActive >= 24) {
      showLocalNotification(
        'Fact Flow misses you!',
        getRandomMessage(MISS_YOU_MESSAGES)
      );
    }
  }
  
  // Update last active
  localStorage.setItem('fact-last-active', now.toString());
};

// Check and trigger notifications based on user behavior
export const checkAndTriggerNotifications = (stats: {
  level: number;
  xp: number;
  streak: number;
  factsViewed: number;
}) => {
  // Update last active
  localStorage.setItem('fact-last-active', Date.now().toString());
  
  // Streak milestone notifications
  if (stats.streak === 7 || stats.streak === 30 || stats.streak === 100) {
    showLocalNotification(
      `${stats.streak}-Day Streak!`,
      `Incredible! You've been learning for ${stats.streak} days straight!`
    );
  }
};

// Initialize notification service
export const initNotificationService = async (email: string, username: string) => {
  // Request permission
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    // Check for daily reminder
    scheduleDailyReminder();
    
    // Set up periodic check (every hour when app is open)
    setInterval(() => {
      scheduleDailyReminder();
    }, 60 * 60 * 1000);
  }
  
  return hasPermission;
};
