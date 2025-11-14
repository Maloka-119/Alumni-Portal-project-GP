

// import React, { useState, useEffect } from 'react';
// import { Image } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
// import './CreatePostBar.css';
// import Swal from "sweetalert2";


// const CreatePostBar = ({ types = [], onSubmit, editingPost, canAdd, onCancelEdit  }) => {
//   const { t } = useTranslation();
//   const [showForm, setShowForm] = useState(false);
//   const [content, setContent] = useState('');
//   const [type, setType] = useState('');
//   const [image, setImage] = useState(null);

//   useEffect(() => {
//     if (editingPost) {
//       setShowForm(true);
//       setContent(editingPost.content || '');
//       setType(editingPost.category || '');
//     }
//   }, [editingPost]);

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!content.trim() || !type) {
//       Swal.fire({
//         icon: "warning",
//         title: t("Please fill all required fields"),
//         timer: 2000,
//         showConfirmButton: false,
//       });
//       return;
//     }

//     const formData = new FormData();
//     formData.append("content", content);
//     formData.append("type", type);
//     if (image) formData.append("images", image);

//     try {
//       onSubmit(formData, editingPost?.id || null);

//       Swal.fire({
//         icon: "success",
//         title: editingPost
//           ? t("Post updated successfully")
//           : t("Post created successfully"),
//         timer: 2000,
//         showConfirmButton: false,
//       });

//       setShowForm(false);
//       setContent("");
//       setType("");
//       setImage(null);
//     } catch (error) {
//       console.error(error);
//       Swal.fire({
//         icon: "error",
//         title: t("Error"),
//         text: t("Something went wrong, please try again"),
//       });
//     }
//   };

//   return (
//     <div className="create-post-wrapper">
//       {/* bar يظهر فقط لو عنده صلاحية add */}
//       {canAdd && !showForm && !editingPost && (
//         <div className="create-post-bar" onClick={() => setShowForm(true)}>
//           <input
//             placeholder={t('Create new post...')}
//             className="post-input"
//             readOnly
//           />
//         </div>
//       )}

//       {/* الفورم تفتح في حالتين: تعديل أو كتابة جديدة */}
//       {(showForm || editingPost) && (
//         <form onSubmit={handleSubmit} className="compact-post-form">
//           <textarea
//             name="content"
//             placeholder={t('Post Content')}
//             required
//             className="input-field"
//             rows="4"
//             value={content}
//             onChange={(e) => setContent(e.target.value)}
//           />

//           <select
//             name="type"
//             required
//             className="input-field"
//             value={type}
//             onChange={(e) => setType(e.target.value)}
//           >
//             <option value="">{t('Select type')}</option>
//             {types.map((typeItem) => (
//               <option key={typeItem} value={typeItem}>{typeItem}</option>
//             ))}
//           </select>

//           <div className="optional-icons">
//             <label title={t('Add Image')}>
//               <input
//                 type="file"
//                 name="image"
//                 accept="image/*"
//                 style={{ display: 'none' }}
//                 onChange={(e) => setImage(e.target.files[0])}
//               />
//               <Image size={20} />
//             </label>
//             {image && <span className="file-name">{image.name}</span>}
//           </div>

//           <div className="form-buttons">
//             <button type="submit" className="submit-btn">
//               {editingPost ? t('Update') : t('Post')}
//             </button>
//             <button
//   type="button"
//   className="cancel-btn"
//   onClick={() => {
//     setShowForm(false)
//     setContent('')
//     setType('')
//     setImage(null)
//     if (editingPost) onCancelEdit()
//   }}
// >
//   {t('Cancel')}
// </button>

//           </div>
//         </form>
//       )}
//     </div>
//   );
// };

// export default CreatePostBar;


import React, { useState, useEffect } from 'react';
import { Image, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './CreatePostBar.css';
import Swal from "sweetalert2";
import API from "../services/api";

const CreatePostBar = ({ types = [], onSubmit, editingPost, canAdd, onCancelEdit }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (editingPost) {
      setShowForm(true);
      setContent(editingPost.content || '');
      // setType(editingPost.category || '');
      setImages(editingPost.images || []);
      setType(editingPost.type || '');
    }
  }, [editingPost]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim() || !type) {
      Swal.fire({
        icon: "warning",
        title: t("Please fill all required fields"),
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const formData = new FormData();
    formData.append("content", content);
    formData.append("type", type);
    images.forEach(img => {
      if (img instanceof File) formData.append("images", img);
    });

    try {
      onSubmit(formData, editingPost?.id || null);

      Swal.fire({
        icon: "success",
        title: editingPost
          ? t("Post updated successfully")
          : t("Post created successfully"),
        timer: 2000,
        showConfirmButton: false,
      });

      setShowForm(false);
      setContent("");
      setType("");
      setImages([]);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Something went wrong, please try again"),
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImages(prev => [...prev, file]);
  };

  const removeImageFromPost = async (postId, imageUrl) => {
    try {
      await API.put(`/posts/${postId}/edit`, {
        removeImages: [imageUrl]
      });
      setImages(prev => prev.filter(img => img !== imageUrl));
      Swal.fire({ icon: 'success', title: 'Image deleted' });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Failed to delete image' });
    }
  };
  

  return (
    <div className="create-post-wrapper">
      {canAdd && !showForm && !editingPost && (
        <div className="create-post-bar" onClick={() => setShowForm(true)}>
          <input
            placeholder={t('Create new post...')}
            className="post-input"
            readOnly
          />
        </div>
      )}

      {(showForm || editingPost) && (
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
              <option key={typeItem} value={typeItem}>{typeItem}</option>
            ))}
          </select>

          <div className="optional-icons">
            <label title={t('Add Image')}>
              <input
                type="file"
                name="image"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <Image size={20} />
            </label>
          </div>

          {images.length > 0 && (
            <div className="selected-images">
              {images.map((img, idx) => (
                <div key={idx} style={{ display: 'inline-block', position: 'relative', margin: '5px' }}>
                  <img
                    src={img instanceof File ? URL.createObjectURL(img) : img}
                    alt={img.name || `img-${idx}`}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  {editingPost && (
  <Trash2
    size={16}
    style={{
      position: 'absolute',
      top: '2px',
      right: '2px',
      cursor: 'pointer',
      color: 'red',
      background: 'rgba(255,255,255,0.7)',
      borderRadius: '50%',
      padding: '2px'
    }}
    onClick={async () => {
      const result = await Swal.fire({
        title: 'Delete this image?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        removeImageFromPost(editingPost.id, img);
      }
    }}
  />
)}


                </div>
              ))}
            </div>
          )}

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
                setImages([]);
                onCancelEdit();
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

