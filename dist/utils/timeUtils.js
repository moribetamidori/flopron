export const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    if (diffInYears > 1)
        return null;
    if (diffInYears === 1)
        return "1 year ago";
    if (diffInMonths > 0)
        return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    if (diffInWeeks > 0)
        return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    if (diffInDays > 0)
        return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    if (diffInHours > 0)
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    if (diffInMinutes > 0)
        return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
    return "just now";
};
