// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link, .nav-cta');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
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
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
    });
});

// Scroll progress bar + back-to-top visibility
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    backToTop.classList.toggle('visible', scrollTop > 500);
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Intersection Observer for scroll-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) translateX(0)';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.skill-category, .project-card, .education-card, .featured-card, .contact-item').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${(index % 4) * 0.08}s, transform 0.6s ease ${(index % 4) * 0.08}s`;
    observer.observe(card);
});

document.querySelectorAll('.timeline-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-30px)';
    item.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
    observer.observe(item);
});

// Rotating typing effect for hero roles
const roles = [
    'agentic AI systems',
    'RAG pipelines',
    'LLM-powered products',
    'document intelligence',
    'production AI on AWS'
];
const typedRole = document.getElementById('typed-role');
let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
    const current = roles[roleIndex];

    if (!deleting) {
        typedRole.textContent = current.slice(0, ++charIndex);
        if (charIndex === current.length) {
            deleting = true;
            setTimeout(typeLoop, 1800);
            return;
        }
        setTimeout(typeLoop, 65);
    } else {
        typedRole.textContent = current.slice(0, --charIndex);
        if (charIndex === 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
        }
        setTimeout(typeLoop, 32);
    }
}

window.addEventListener('load', () => {
    typedRole.textContent = '';
    charIndex = 0;
    setTimeout(typeLoop, 600);
});

// Counter animation for stats
const statNumbers = document.querySelectorAll('.stat-item h3');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const number = parseFloat(target.dataset.count || target.textContent);
            const suffix = target.dataset.suffix || '';

            let current = 0;
            const increment = Math.max(number / 40, 0.5);

            const updateCounter = () => {
                current += increment;
                if (current < number) {
                    target.textContent = Math.floor(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    target.textContent = number + suffix;
                }
            };

            updateCounter();
            statsObserver.unobserve(target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => statsObserver.observe(stat));

// Business / Technical view toggles on featured project cards
document.querySelectorAll('.featured-card').forEach(card => {
    const buttons = card.querySelectorAll('.view-btn');
    const panes = card.querySelectorAll('.view-pane');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            buttons.forEach(b => b.classList.toggle('active', b === btn));
            panes.forEach(p => p.classList.toggle('active', p.dataset.pane === view));
        });
    });
});

// Contact form → opens the visitor's email client pre-filled
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const subject = document.getElementById('cf-subject').value.trim();
    const message = document.getElementById('cf-message').value.trim();

    const body = `${message}\n\n— ${name} (${email})`;
    const mailto = `mailto:prajapatipareshkumar1032@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    contactForm.reset();
});

// ============ AI Chatbot ============
const chatToggle = document.getElementById('chat-toggle');
const closeChat = document.getElementById('close-chat');
const clearChat = document.getElementById('clear-chat');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const chatSuggestions = document.getElementById('chat-suggestions');
let sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
let isSending = false;

const WELCOME_HTML = `<div class="message incoming"><p>Hi! I'm Paresh's AI assistant. Ask me anything about his skills, projects, or whether he'd fit your role!</p></div>`;

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

// Clear conversation (new session)
clearChat.addEventListener('click', () => {
    chatMessages.innerHTML = WELCOME_HTML;
    sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
    chatSuggestions.style.display = '';
});

// Suggested question chips
chatSuggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.textContent;
        sendMessage();
    });
});

function renderMarkdown(text) {
    return typeof marked !== 'undefined' ? marked.parse(text) : `<p>${text}</p>`;
}

// Add Message to UI
function addMessage(text, isOutgoing = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;

    if (isOutgoing) {
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
    } else {
        messageDiv.innerHTML = renderMarkdown(text);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send Message to Backend with Real-Time LLM Token Streaming or JSON/Text Response
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    chatSuggestions.style.display = 'none';

    // Add user message
    addMessage(text, true);
    chatInput.value = '';

    // Create incoming AI message container with typing indicator
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message incoming';
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
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

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error (${response.status})`);
        }

        const contentType = response.headers.get('content-type') || '';

        // If server returns standard JSON or plain text (e.g. Netlify Function)
        if (contentType.includes('application/json') || !contentType.includes('text/event-stream')) {
            const rawText = await response.text();
            let fullReply = '';

            try {
                const parsed = JSON.parse(rawText);
                if (parsed.error) {
                    throw new Error(parsed.error);
                }
                fullReply = parsed.reply || parsed.content || parsed.message || '';
            } catch (e) {
                // If not JSON, use raw plain text
                fullReply = rawText;
            }

            // If we got a valid JSON/plain-text reply, render and return
            if (fullReply) {
                contentDiv.innerHTML = renderMarkdown(fullReply);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return;
            }
        }

        // Handle Real-Time SSE Stream (e.g. Express backend)
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
                        contentDiv.innerHTML = renderMarkdown(fullText);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    } else if (parsed.reply) {
                        fullText = parsed.reply;
                        contentDiv.innerHTML = renderMarkdown(fullText);
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
        contentDiv.innerHTML = `<p>Sorry, I'm having trouble connecting right now. Please try again later — or reach Paresh directly at <a href="mailto:prajapatipareshkumar1032@gmail.com">prajapatipareshkumar1032@gmail.com</a>.</p>`;
    } finally {
        isSending = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Event Listeners for Input
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Console message for developers
console.log('%c👋 Welcome to Paresh Prajapati\'s Portfolio!', 'color: #818cf8; font-size: 20px; font-weight: bold;');
console.log('%cInterested in the code? Feel free to reach out!', 'color: #a78bfa; font-size: 14px;');
