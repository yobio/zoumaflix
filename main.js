/*
window.addEventListener('scroll', () => {
  const banner = document.getElementById('banner');
  const bannerImg = document.getElementById('banner-img');
  const scrollTop = window.scrollY || document.documentElement.scrollTop;   // Get scroll position

  if (scrollTop > 40) {
    banner.style.height = '80px';
    bannerImg.style.height = '50px';
  } else {
    banner.style.height = '200px';
    bannerImg.style.height = '120px';
  }
});
*/


updateBanner();
window.addEventListener('scroll', updateBanner);

function updateBanner() {
  const banner = document.getElementById('banner');
  const bannerImg = document.getElementById('banner-img');
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  const maxTop = 0;
  const minTop = 160;

  let t = (scrollTop - maxTop) / (minTop - maxTop);
  // clamp
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  // Hauteur entre 200px et 80px
  const minHeight = 80;
  const maxHeight = 200;
  let newHeight = maxHeight - (maxHeight - minHeight) * t;

  banner.style.height = `${newHeight}px`;

  const minImgHeight = 50;
  const maxImgHeight = 120;
  let newImgHeight = maxImgHeight - (maxImgHeight - minImgHeight) * t;

  bannerImg.style.height = `${newImgHeight}px`;
}
