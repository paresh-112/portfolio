// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');

    // Animate hamburger
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(15, 23, 42, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.5)';
    } else {
        navbar.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    }
});

// Active navigation link on scroll
const sections = document.querySelectorAll('section[id]');

function scrollActive() {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 100;
        const sectionId = current.getAttribute('id');
        const navLink = document.querySelector('.nav-menu a[href*=' + sectionId + ']');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink?.classList.add('active');
        } else {
            navLink?.classList.remove('active');
        }
    });
}

window.addEventListener('scroll', scrollActive);

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for fade-in animations
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Animate skill cards on scroll
const skillCards = document.querySelectorAll('.skill-category');
skillCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Animate project cards on scroll
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Animate education cards on scroll
const educationCards = document.querySelectorAll('.education-card');
educationCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Contact form handling
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Show success message
    alert('Thank you for your message! This is a demo form. To make it functional, you need to add backend integration.');

    // Reset form
    contactForm.reset();
});

// Typing effect for hero subtitle (optional enhancement)
const heroSubtitle = document.querySelector('.hero-subtitle');
const subtitleText = heroSubtitle.textContent;
heroSubtitle.textContent = '';

let charIndex = 0;
function typeSubtitle() {
    if (charIndex < subtitleText.length) {
        heroSubtitle.textContent += subtitleText.charAt(charIndex);
        charIndex++;
        setTimeout(typeSubtitle, 100);
    }
}

// Start typing effect after page load
window.addEventListener('load', () => {
    setTimeout(typeSubtitle, 500);
});

// Add cursor pointer effect
document.addEventListener('mousemove', (e) => {
    const cursor = document.createElement('div');
    cursor.style.position = 'fixed';
    cursor.style.width = '10px';
    cursor.style.height = '10px';
    cursor.style.borderRadius = '50%';
    cursor.style.background = 'rgba(99, 102, 241, 0.5)';
    cursor.style.pointerEvents = 'none';
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursor.style.transition = 'opacity 0.5s';
    document.body.appendChild(cursor);

    setTimeout(() => {
        cursor.style.opacity = '0';
        setTimeout(() => cursor.remove(), 500);
    }, 100);
});

// Counter animation for stats
const statNumbers = document.querySelectorAll('.stat-item h3');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const text = target.textContent;
            const hasPlus = text.includes('+');
            const number = parseFloat(text);

            let current = 0;
            const increment = number / 50;

            const updateCounter = () => {
                current += increment;
                if (current < number) {
                    target.textContent = Math.floor(current * 100) / 100 + (hasPlus ? '+' : '');
                    requestAnimationFrame(updateCounter);
                } else {
                    target.textContent = text;
                }
            };

            updateCounter();
            statsObserver.unobserve(target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => statsObserver.observe(stat));

// Add particle effect to hero section (optional)
function createParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '5px';
    particle.style.height = '5px';
    particle.style.borderRadius = '50%';
    particle.style.background = 'rgba(99, 102, 241, 0.5)';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.pointerEvents = 'none';
    particle.style.animation = 'float 10s infinite';

    document.querySelector('.floating-shapes').appendChild(particle);

    setTimeout(() => particle.remove(), 10000);
}

// Create particles periodically
setInterval(createParticle, 2000);

// Smooth reveal for timeline items
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-30px)';
    item.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
    observer.observe(item);
});

// Add hover effect for social links
const socialLinks = document.querySelectorAll('.social-links a');
socialLinks.forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.1)';
    });

    link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// AI Chatbot Logic
const chatToggle = document.getElementById('chat-toggle');
const closeChat = document.getElementById('close-chat');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const sessionId = 'session_' + Math.random().toString(36).substring(2, 9);

// Toggle Chat Window
chatToggle.addEventListener('click', () => {
    chatContainer.classList.toggle('hidden');
    if (!chatContainer.classList.contains('hidden')) {
        chatInput.focus();
    }
});

closeChat.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
});

// Add Message to UI
function addMessage(text, isOutgoing = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
    
    if (isOutgoing) {
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
    } else {
        // Use marked for incoming messages to render markdown
        messageDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : `<p>${text}</p>`;
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Smooth scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send Message to Backend with Real-Time LLM Token Streaming
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, true);
    chatInput.value = '';

    // Create incoming AI message container
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message incoming';
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = '<p><em>Thinking...</em></p>';
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Resolve API endpoint based on environment (Netlify vs Local file)
    const apiEndpoint = window.location.protocol === 'file:' 
        ? 'http://localhost:8000/api/chat' 
        : '/api/chat';

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: text,
                session_id: sessionId
            }),
        });

        if (!response.ok) throw new Error('Failed to connect to AI server');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let isFirstChunk = true;
        let streamBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split('\n');
            // Keep the last potentially incomplete line in streamBuffer
            streamBuffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;

                const dataStr = trimmed.replace(/^data:\s*/, '').trim();
                if (dataStr === '[DONE]') break;

                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.content) {
                        if (isFirstChunk) {
                            fullText = '';
                            isFirstChunk = false;
                        }
                        fullText += parsed.content;
                        contentDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullText) : `<p>${fullText}</p>`;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    } else if (parsed.reply) {
                        fullText = parsed.reply;
                        contentDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullText) : `<p>${fullText}</p>`;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                } catch (e) {
                    // Ignore parse error for non-JSON SSE metadata
                }
            }
        }

        if (!fullText) {
            contentDiv.innerHTML = "<p>Sorry, I didn't receive a response. Please try again.</p>";
        }
    } catch (error) {
        console.error('Chat Error:', error);
        contentDiv.innerHTML = "<p>Sorry, I'm having trouble connecting right now. Please try again later!</p>";
    }
}

// Event Listeners for Input
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Console message for developers
console.log('%c👋 Welcome to Paresh Prajapati\'s Portfolio!', 'color: #6366f1; font-size: 20px; font-weight: bold;');
console.log('%cInterested in the code? Feel free to reach out!', 'color: #8b5cf6; font-size: 14px;');
