import React, { useState, useEffect } from 'react';
import { Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './CreatePostBar.css';
import Swal from "sweetalert2";

const CreatePostBar = ({ types = [], onSubmit, editingPost }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (editingPost) {
      setShowForm(true);
      setContent(editingPost.content || '');
      setType(editingPost.category || '');
    }
  }, [editingPost]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim() || !type) {
      Swal.fire({
        icon: "warning",
        title: t("Please fill all required fields") || "من فضلك املأ كل البيانات المطلوبة",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const formData = new FormData();
    formData.append("content", content);
    formData.append("type", type);
    if (image) formData.append("images", image);

    try {
      onSubmit(formData, editingPost?.id || null);

      Swal.fire({
        icon: "success",
        title: editingPost
          ? t("Post updated successfully") || "تم تعديل المنشور بنجاح"
          : t("Post created successfully") || "تم نشر المنشور بنجاح",
        timer: 2000,
        showConfirmButton: false,
      });

      setShowForm(false);
      setContent("");
      setType("");
      setImage(null);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: t("Error") || "خطأ",
        text:
          t("Something went wrong, please try again") ||
          "حدث خطأ ما، حاول مرة أخرى",
      });
    }
  };

  return (
    <div className="create-post-wrapper">
      {!showForm && (
        <div className="create-post-bar" onClick={() => setShowForm(true)}>
          <input
            placeholder={t('Create new post...')}
            className="post-input"
            readOnly
          />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="compact-post-form">
          <textarea
            name="content"
            placeholder={t('Post Content')}
            required
            className="input-field"
            rows="4"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <select
            name="type"
            required
            className="input-field"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">{t('Select type')}</option>
            {types.map((typeItem) => (
              <option key={typeItem} value={typeItem}>
                {typeItem}
              </option>
            ))}
          </select>

          <div className="optional-icons">
            <label title={t('Add Image')}>
              <input
                type="file"
                name="image"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setImage(e.target.files[0])}
              />
              <Image size={20} />
            </label>
            {image && <span className="file-name">{image.name}</span>}
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-btn">
              {editingPost ? t('Update') : t('Post')}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setShowForm(false);
                setContent('');
                setType('');
                setImage(null);
              }}
            >
              {t('Cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreatePostBar;
