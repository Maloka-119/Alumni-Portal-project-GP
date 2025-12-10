
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import Footer from "../../components/Footer";
import "./LandingPage.css";
import Unibackground from "./Unibackgroundcr.jpeg";
import TypingText from "../../components/TypingText";
import API from "../../services/api";
import HelwanLogo from "./logo-white-deskt-min.png";
import NewLogo from '../../capital-uni-logo.png'
import NewBg from '../../Newbg.jpg'

export default function LandingPage() {
  const navigate = useNavigate();
  const footerRef = useRef(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [landingPosts, setLandingPosts] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(0);

  
  useEffect(() => {
    const fetchLandingPosts = async () => {
      try {
        const res = await API.get("/posts/landing");
        const postsArray = Array.isArray(res.data.data) ? res.data.data : [];
        setLandingPosts(postsArray);
      } catch (err) {
        console.error("Error loading landing posts:", err);
      }
    };
    fetchLandingPosts();
  }, []);

  const successStories = landingPosts.filter(
    (post) => post.category === "Success story"
  );
  const exclusiveEvents = landingPosts.filter(
    (post) => post.category !== "Success story"
  );


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEvent((prev) => (prev + 1) % exclusiveEvents.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [exclusiveEvents.length]);


  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await API.get("/faqs");
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
      // style={{ backgroundImage: `url(${Unibackground})` }}
      // style={{ backgroundImage: `url(${NewBg})` }}
      
    >
      {/* <img src={HelwanLogo} alt="جامعة حلوان" className="hero-logo" /> */}
      <img src={NewLogo} alt="جامعة العاصمه" className="hero-logo" />

      <button onClick={scrollToFooter} className="contactt-btn">
        Contact Us / اتصل بنا
      </button>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-text">
            <TypingText
              // lines={[
              //   "Welcome to Helwan University Alumni Portal",
              //   "مرحبا بكم في بوابة خريجي جامعة حلوان",
              // ]}
              lines={[
                "Welcome to Capital University Alumni Portal",
                "مرحبا بكم في بوابة خريجي جامعة العاصمه",
              ]}
            />
            {/* <p style={{ color: "white" }}>
              The Alumni Portal connects graduates of Helwan University to share
              knowledge, find jobs, and stay in touch.
              <br />
              تربط بوابة الخريجين خريجي جامعة حلوان لتبادل المعرفة والفرص
              والبقاء على تواصل.
            </p> */}
            <p style={{ color: "white" }}>
              The Alumni Portal connects graduates of Capital University "Helwan University" to share
              knowledge, find jobs, and stay in touch.
              <br />
              تربط بوابة الخريجين خريجي جامعة العاصمه "جامعه حلوان " لتبادل المعرفة والفرص
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
                Sign In / تسجيل الدخول
              </button>
            </nav>
          </div>
        </section>

        <div className="page-body">

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
{/* Success Stories */}
<section className="success-section">
  <h3>Success Stories / قصص النجاح</h3>
  <div className="success-scroll">
    <button
      className="scroll-btn left"
      onClick={() => {
        document
          .querySelector(".success-cards")
          ?.scrollBy({ left: -400, behavior: "smooth" });
      }}
    >
      <ChevronLeft size={28} />
    </button>

    <div className="success-cards">
      {successStories.map((story) => (
        <div className="success-card" key={story.post_id}>
          <div className="story-text">
            <h4>{story.author["full-name"]}</h4>
            <p>{story.content}</p>
          </div>
          {story.images && story.images.length > 0 && (
            <img
              src={story.images[0]}
              alt={story.author["full-name"]}
            />
          )}
        </div>
      ))}
    </div>

    <button
      className="scroll-btn right"
      onClick={() => {
        document
          .querySelector(".success-cards")
          ?.scrollBy({ left: 400, behavior: "smooth" });
      }}
    >
      <ChevronRight size={28} />
    </button>
  </div>
</section>

{/* Exclusive Events  */}
<section className="exclusive-section">
  <h3>Exclusive Events / الفعاليات الحصرية</h3>
  <div className="exclusive-container">
    {exclusiveEvents.map((event, i) => (
      <div
        key={event.post_id}
        className={`exclusive-card ${i === currentEvent ? "active" : ""}`}
        style={{ display: i === currentEvent ? "flex" : "none" }}
      >
        <div className="exclusive-text">
          <h4>{event.category}</h4>
          <p>{event.content}</p>
        </div>
        {event.images && event.images.length > 0 && (
          <img
            src={event.images[0]}
            alt={event.category}
            className="exclusive-img"
          />
        )}
      </div>
    ))}

    <div className="exclusive-dots">
      {exclusiveEvents.map((_, i) => (
        <span
          key={i}
          className={`dot ${i === currentEvent ? "active" : ""}`}
          onClick={() => setCurrentEvent(i)}
        ></span>
      ))}
    </div>
  </div>
</section>


        {/* ===== FAQ ===== */}
        <div className="floating-faq">
          <button className="faq-toggle" onClick={() => setFaqOpen(!faqOpen)}>
            <HelpCircle size={26} color="white" />
          </button>
          <div className={`faq-popup ${faqOpen ? "open" : ""}`}>
            <h4>FAQ / الأسئلة الشائعة</h4>
            <div className="faq-list">
              {faqs.map((faq) => (
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
        </div>
      </main>
    </div>
  );
}
