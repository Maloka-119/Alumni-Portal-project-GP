import React, { useEffect, useState , useRef} from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, Briefcase, Mail } from "lucide-react";
import Footer from "../../components/Footer";
import "./LandingPage.css";
import Unibackground from './Unibackgroundcr.jpeg'
import { ChevronLeft, ChevronRight } from "lucide-react";
import TypingText from "../../components/TypingText"; 
import API from "../../services/api";
import HelwanLogo from './logo-white-deskt-min.png'; 


export default function LandingPage() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const footerRef = useRef(null);

  useEffect(() => {
    const dummyFaqs = [
      { question_en: "What is Helwan University?", question_ar: "ما هي جامعة حلوان؟", answer_en: "A top university in Egypt.", answer_ar: "جامعة رائدة في مصر." },
      { question_en: "Who can join?", question_ar: "من يمكنه الانضمام؟", answer_en: "Graduates only.", answer_ar: "الخريجون فقط." }
    ];
    setFaqs(dummyFaqs);
  }, []);
  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  

  return (
    <div className="landing-container" style={{ backgroundImage: `url(${Unibackground})` }}>
<img
  src={HelwanLogo}
  alt="جامعة حلوان"
  className="hero-logo"
/>
<button onClick={scrollToFooter} className="contactt-btn">Contact Us / اتصل بنا</button>

      <main className="landing-main">

        <section className="hero-section">
          
          <div className="hero-text">
          <TypingText
  lines={[
    "Welcome to Helwan University Alumni Portal",
    "مرحبا بكم في بوابة خريجي جامعة حلوان"
  ]}
/>
<p style={{color:"white"}}>
            The Alumni Portal connects graduates of Helwan University to share knowledge, find jobs, and stay in touch.<br />
            تربط بوابة الخريجين خريجي جامعة حلوان لتبادل المعرفة والفرص والبقاء على تواصل.
          </p>

            <nav className="nav-links">
            <button onClick={() => navigate("/helwan-alumni-portal/register")} className="btn-primary">
              Sign Up / تسجيل
            </button>
            <button onClick={() => navigate("/helwan-alumni-portal/login")} className="btn-outline">
              sign In / تسجيل الدخول
            </button>
            
          </nav>
            
          </div>
        </section>

        <section className="about-section">
          {/* <h3>About the Portal / عن البوابة</h3> */}
          <p >
              Connect with graduates, explore opportunities, and stay updated with university news.<br />
              تواصل مع الخريجين واستكشف الفرص وابقَ على اطلاع على أخبار الجامعة.
            </p>
          
          <div className="about-features">
            <div className="feature-card">
              <Users className="icon" />
              <h4>Networking / التواصل</h4>
              <p>Connect with peers and build valuable relationships. / تواصل مع الزملاء.</p>
            </div>
            <div className="feature-card">
              <Briefcase className="icon" />
              <h4>Opportunities / الفرص</h4>
              <p>Find jobs, internships, and career guidance. / اكتشف الوظائف والتدريب.</p>
            </div>
            <div className="feature-card">
              <BookOpen className="icon" />
              <h4>Events / الفعاليات</h4>
              <p>Stay informed about university and alumni events. / تابع فعاليات الجامعة.</p>
            </div>
          </div>
        </section>

        <br/> 
        
            

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

            
            <section className="faq-section">
          <h3>FAQ / الأسئلة الشائعة</h3>
          <div className="faq-list">
  {Array.isArray(faqs) && faqs.map((f, i) => (
    <details key={i}>
      <summary>{f.question_en} / {f.question_ar}</summary>
      <p>{f.answer_en}<br />{f.answer_ar}</p>
    </details>
  ))}
</div>
</section>
<div className="cta-section">
  <p className="cta-text">
    Access your alumni account or join the network now<br />
    الوصول إلى حساب الخريجين الخاص بك أو الانضمام إلى الشبكة الآن
  </p>
  <div className="cta-buttons">
    <button onClick={() => navigate("/helwan-alumni-portal/login")} className="btn-outline">
     Have an account / لدى حساب
    </button>
    <button onClick={() => navigate("/helwan-alumni-portal/register")} className="btn-primary">
    Join us / انضم لنا
    </button>
  </div>
</div>

        <Footer ref={footerRef}/>

      </main>
    </div>
  );
}
