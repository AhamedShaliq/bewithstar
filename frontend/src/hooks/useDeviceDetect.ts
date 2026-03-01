export const useDeviceDetect = () => {
    if (typeof window === 'undefined') {
        return { isMobile: false, isDesktop: true };
    }

    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);

    // Modern iPads can report their user agent as a Macintosh desktop.
    // We detect them by checking if it's a Mac AND has touch capabilities.
    const isMacWithTouch = userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1;

    const isMobile = isMobileUA || isMacWithTouch;

    return { isMobile, isDesktop: !isMobile };
};
