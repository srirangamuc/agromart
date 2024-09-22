// animations.js
gsap.registerPlugin(ScrollTrigger);

// Hero section animation
gsap.from(".hero-section .hero-content", {
    y: 50,
    opacity: 0,
    duration: 1,
    scrollTrigger: {
        trigger: ".hero-section",
        start: "top center",
        end: "bottom top",
        scrub: true,
        markers: true // Set to false when not debugging
    }
});

// Animate hero image
gsap.from(".hero-image img", {
    scale: 0.8,
    opacity: 0,
    duration: 1.5,
    scrollTrigger: {
        trigger: ".hero-image",
        start: "top center",
        end: "bottom top",
        scrub: true,
        markers: true // Set to false when not debugging
    }
});

// Download section animation
gsap.from(".download-section", {
    y: 100,
    opacity: 0,
    duration: 1.5,
    scrollTrigger: {
        trigger: ".download-section",
        start: "top center",
        end: "bottom top",
        scrub: true,
        markers: true // Set to false when not debugging
    }
});
