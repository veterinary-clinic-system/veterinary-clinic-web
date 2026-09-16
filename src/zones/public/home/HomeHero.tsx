import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/basic';
import { cloudinaryImage } from '@/utils/cloudinary-assets';

const MOMENTS = [
  {
    image: 'images/golden-retriever-walking-v1.png',
    label: 'Một cái ôm.',
    caption: 'Đủ để ngày trở nên dịu dàng.',
    className: 'garden-photo-left',
  },
  {
    image: 'images/pets-photoreal-v1.png',
    label: 'Một người bạn.',
    caption: 'Cùng bạn đi qua những ngày thật đẹp.',
    className: 'garden-photo-center',
  },
  {
    image: 'images/british-shorthair-jumping-v1.png',
    label: 'Cả một gia đình.',
    caption: 'Và yêu thương luôn ở lại.',
    className: 'garden-photo-right',
  },
];

export function HomeHero() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  return (
    <section className="garden-hero" aria-labelledby="garden-title">
      <div className="garden-hero-heading">
        <p className="garden-eyebrow">
          <span /> VETAI HUB · CHO NHỮNG NGƯỜI BẠN NHỎ
        </p>
        <h1 id="garden-title">
          <span>Thế giới nhỏ.</span>
          <span>
            Yêu thương <em>lớn.</em>
          </span>
        </h1>
        <p className="garden-hero-description">
          Từ một cái vẫy đuôi đến cả một đời gắn bó.
          <br />
          Cùng bạn chăm sóc bé, bằng tất cả yêu thương.
        </p>
        <div className="garden-hero-actions">
          <Link to="/booking" className="garden-cta">
            Đặt lịch cho bé <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
          <Link to="/services" className="garden-quiet-link">
            Khám phá dịch vụ <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <Link to="/my/pets" className="garden-floating-card garden-health-card">
        <div className="garden-health-icon">
          <Icon name="paw" className="h-7 w-7" />
          <span aria-hidden="true">♡</span>
        </div>
        <span className="garden-card-eyebrow">GÓC NHỎ CỦA BÉ</span>
        <strong>
          Mỗi cột mốc.
          <br />
          Đều đáng lưu giữ.
        </strong>
        <span className="garden-card-link">
          Hồ sơ sức khỏe <span aria-hidden="true">↗</span>
        </span>
      </Link>
      <button
        type="button"
        className="garden-floating-card garden-moment-card"
        onClick={() => {
          dialog.current?.showModal();
          void video.current?.play().catch(() => undefined);
        }}
      >
        <img src={cloudinaryImage('images/pet-companion-poster.jpg')} alt="Mèo đang chơi đùa cùng chủ" />
        <span className="garden-play" aria-hidden="true">
          ▷
        </span>
        <span>
          Hạnh phúc đôi khi
          <br />
          chỉ nhỏ như thế.
        </span>
        <small>XEM MỘT CHÚT YÊU THƯƠNG</small>
      </button>

      <div className="garden-photo-stage">
        <div className="garden-stage-orbit" aria-hidden="true" />
        {MOMENTS.map((moment) => (
          <figure key={moment.image} className={`garden-photo ${moment.className}`}>
            <img
              src={cloudinaryImage(moment.image)}
              alt={moment.label + ' ' + moment.caption}
            />
            <figcaption>
              <strong>{moment.label}</strong>
              <span>{moment.caption}</span>
            </figcaption>
          </figure>
        ))}
        <div className="garden-love-seal" aria-hidden="true">
          <span>CHĂM SÓC TỪ TRÁI TIM</span>
          <Icon name="paw" className="h-7 w-7" />
          <span>VETAI · WITH LOVE</span>
        </div>
      </div>
      <div className="garden-hero-bottom">
        <span>
          <Icon name="stethoscope" className="h-4 w-4" /> Bác sĩ tận tâm
        </span>
        <span>
          <Icon name="calendar" className="h-4 w-4" /> Đặt lịch dễ dàng
        </span>
        <span>
          <Icon name="paw" className="h-4 w-4" /> Đồng hành cùng bé
        </span>
        <a href="#garden-discover">
          Còn nhiều điều để khám phá <span aria-hidden="true">↓</span>
        </a>
      </div>
      <dialog
        ref={dialog}
        className="garden-video-dialog"
        aria-label="Một khoảnh khắc cùng thú cưng"
        onClose={() => video.current?.pause()}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Đóng video">
            ×
          </button>
          <video
            ref={video}
            src="/videos/pet-companion.mp4"
            poster={cloudinaryImage('images/pet-companion-poster.jpg')}
            controls
            playsInline
            preload="none"
          />
          <p>Hạnh phúc đôi khi chỉ nhỏ như thế. ♡</p>
        </div>
      </dialog>
    </section>
  );
}
