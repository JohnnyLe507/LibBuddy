import { useEffect, useState } from "react";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

type Bestseller = {
  title: string;
  author: string;
  book_image: string;
  amazon_product_url: string;
};

function BestsellerCarousel() {
  const [books, setBooks] = useState<Bestseller[]>([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/bestsellers`)
      .then((res) => {
        setBooks(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch bestsellers:", err);
      });
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    speed: 3000,
    autoplay: true,
    autoplaySpeed: 4000,
    cssEase: "linear",
    pauseOnHover: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="relative z-30 my-16 px-4 max-w-6xl mx-auto">
      <div className="flex flex-col items-center mb-6">
        <img
          src="/NYTLogo.png"
          alt="NYT Best Seller Logo"
          className="h-20 w-auto drop-shadow-lg"
        />
        <div className="w-48 h-0.5 bg-black/70 rounded-full mt-3"></div>
      </div>
      <Slider {...settings}>
        {books.map((book, index) => (
          <a
            key={index}
            href={book.amazon_product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2"
          >
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl p-4 hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col justify-between text-white">
              <img
                src={book.book_image}
                alt={book.title}
                className="h-64 object-cover rounded-lg mb-4 mx-auto"
              />
              <div className="text-center px-2">
                <h3 className="text-lg font-semibold">{book.title}</h3>
                <p className="text-sm opacity-80">by {book.author}</p>
              </div>
            </div>
          </a>
        ))}
      </Slider>
    </div>
  );
}

export default BestsellerCarousel;
