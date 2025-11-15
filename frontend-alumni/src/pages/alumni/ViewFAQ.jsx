import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import API from "../../services/api";
import "./ViewFAQ.css";

const ViewFAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await API.get("/faqs");
      // console.log("Raw API response:", res);

      // احصل على array من data
      const faqArray = Array.isArray(res.data.data) ? res.data.data : [];
      setFaqs(faqArray);
      // console.log("FAQs state:", faqArray);
    } catch (err) {
      console.error("Error loading FAQs:", err);
    }
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="view-faq">
      <h2 className="uni-header">Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={faq.faq_id} className="faq-item">
            <div className="faq-header" onClick={() => toggleFAQ(index)}>
              <h4>{faq.question}</h4>
              {openIndex === index ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
            <div className={`faq-answer ${openIndex === index ? "open" : ""}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewFAQ;
