import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, Briefcase, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import Footer from "../../components/Footer";
import "./LandingPage.css";
import Unibackground from "./Unibackgroundcr.jpeg";
import TypingText from "../../components/TypingText";
import API from "../../services/api";
import HelwanLogo from "./logo-white-deskt-min.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const footerRef = useRef(null);
  const [faqOpen, setFaqOpen] = useState(false);

  const [currentEvent, setCurrentEvent] = useState(0);
  const events = [
    {
      title: "Alumni Annual Gala 2025",
      description:
        "A celebration of Helwan University graduates with networking, awards, and live music. / احتفال خريجي جامعة حلوان السنوي يتضمن جوائز وموسيقى حية.",
      img: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Innovation Summit",
      description:
        "Showcase of alumni startups and research achievements. / عرض لمشروعات خريجي الجامعة وإنجازاتهم البحثية.",
      img: "https://images.unsplash.com/photo-1532619187608-e5375cab36aa?crop=faces&fit=crop&w=600&h=600",
    },
    {
      title: "Career Fair 2025",
      description:
        "Exclusive job fair for Helwan graduates. / معرض توظيف حصري لخريجي جامعة حلوان.",
      img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?crop=faces&fit=crop&w=600&h=600",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEvent((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [events.length]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await API.get("/faqs");
        // نحصل على الـ array من data
        const faqArray = Array.isArray(res.data.data) ? res.data.data : [];
        setFaqs(faqArray);
      } catch (err) {
        console.error("Error loading FAQs:", err);
      }
    };
  
    fetchFaqs();
  }, []);
  

  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${Unibackground})` }}
    >
      <img src={HelwanLogo} alt="جامعة حلوان" className="hero-logo" />
      <button onClick={scrollToFooter} className="contactt-btn">
        Contact Us / اتصل بنا
      </button>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-text">
            <TypingText
              lines={[
                "Welcome to Helwan University Alumni Portal",
                "مرحبا بكم في بوابة خريجي جامعة حلوان",
              ]}
            />
            <p style={{ color: "white" }}>
              The Alumni Portal connects graduates of Helwan University to share
              knowledge, find jobs, and stay in touch.
              <br />
              تربط بوابة الخريجين خريجي جامعة حلوان لتبادل المعرفة والفرص
              والبقاء على تواصل.
            </p>

            <nav className="nav-links">
              <button
                onClick={() => navigate("/helwan-alumni-portal/register")}
                className="btn-primary"
              >
                Sign Up / تسجيل
              </button>
              <button
                onClick={() => navigate("/helwan-alumni-portal/login")}
                className="btn-outline"
              >
                sign In / تسجيل الدخول
              </button>
            </nav>
          </div>
        </section>

        <section className="about-section">
          <p>
            Connect with graduates, explore opportunities, and stay updated with
            university news.
            <br />
            تواصل مع الخريجين واستكشف الفرص وابقَ على اطلاع على أخبار الجامعة.
          </p>

          <div className="about-features">
            <div className="feature-card">
              <Users className="icon" />
              <h4>Networking / التواصل</h4>
              <p>Connect with peers and build valuable relationships.</p>
            </div>
            <div className="feature-card">
              <Briefcase className="icon" />
              <h4>Opportunities / الفرص</h4>
              <p>Find jobs, internships, and career guidance.</p>
            </div>
            <div className="feature-card">
              <BookOpen className="icon" />
              <h4>Events / الفعاليات</h4>
              <p>Stay informed about university and alumni events.</p>
            </div>
          </div>
        </section>

        <section className="success-section">
          <h3>Success Stories / قصص النجاح</h3>
          <div className="success-scroll">
            <button
              className="scroll-btn left"
              onClick={() => {
                document
                  .querySelector(".success-cards")
                  .scrollBy({ left: -400, behavior: "smooth" });
              }}
            >
              <ChevronLeft size={28} />
            </button>

            <div className="success-cards">
              {[
                {
                  name: "Eng. Alia Hassan",
                  description:
                    "Graduated from Faculty of Engineering, Helwan University – Now Senior Project Manager at Siemens, Germany.",
                  img: "https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?crop=faces&fit=crop&w=600&h=600",
                },
                {
                  name: "Dr. Omnia Youssef",
                  description:
                    "Graduated from Faculty of Medicine – Now Consultant Cardiologist at NHS, UK.",
                  img: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?crop=faces&fit=crop&w=600&h=600",
                },
                {
                  name: "Ms. Sara Nabil",
                  description:
                    "Graduated from Computer Science – Now Data Scientist at Google, Ireland.",
                  img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=faces&fit=crop&w=600&h=600",
                },
              ].map((story, i) => (
                <div className="success-card" key={i}>
                  <div className="story-text">
                    <h4>{story.name}</h4>
                    <p>{story.description}</p>
                  </div>
                  <img src={story.img} alt={story.name} />
                </div>
              ))}
            </div>

            <button
              className="scroll-btn right"
              onClick={() => {
                document
                  .querySelector(".success-cards")
                  .scrollBy({ left: 400, behavior: "smooth" });
              }}
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </section>

        <section className="exclusive-section">
          <h3>Exclusive Events / الفعاليات الحصرية</h3>
          <div className="exclusive-container">
            {events.map((event, i) => (
              <div
                key={i}
                className={`exclusive-card ${i === currentEvent ? "active" : ""}`}
                style={{ display: i === currentEvent ? "flex" : "none" }}
              >
                <div className="exclusive-text">
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                </div>
                <img src={event.img} alt={event.title} className="exclusive-img" />
              </div>
            ))}

            <div className="exclusive-dots">
              {events.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === currentEvent ? "active" : ""}`}
                  onClick={() => setCurrentEvent(i)}
                ></span>
              ))}
            </div>
          </div>
        </section>

        <div className="floating-faq">
          <button className="faq-toggle" onClick={() => setFaqOpen(!faqOpen)}>
            <HelpCircle size={26} color="white" />
          </button>
          <div className={`faq-popup ${faqOpen ? "open" : ""}`}>
            <h4>FAQ / الأسئلة الشائعة</h4>
            <div className="faq-list">
  {faqs.map((faq, i) => (
    <details key={faq.faq_id}>
      <summary>{faq.question}</summary>
      <p>{faq.answer}</p>
    </details>
  ))}
</div>

          </div>
        </div>

        <div className="cta-section">
          <p className="cta-text">
            Access your alumni account or join the network now
            <br />
            الوصول إلى حساب الخريجين الخاص بك أو الانضمام إلى الشبكة الآن
          </p>
          <div className="cta-buttons">
            <button
              onClick={() => navigate("/helwan-alumni-portal/login")}
              className="btn-outline"
            >
              Have an account / لدى حساب
            </button>
            <button
              onClick={() => navigate("/helwan-alumni-portal/register")}
              className="btn-primary"
            >
              Join us / انضم لنا
            </button>
          </div>
        </div>

        <Footer ref={footerRef} />
      </main>
    </div>
  );
}



