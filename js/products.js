/* =========================================================
   Product catalog — replace this with real data, or swap
   this whole file for a fetch() call to your own API/DB.
   ========================================================= */
const PRODUCTS = [
  { id:1,  name:"Canvas Field Tote",      category:"Bags",       price:58,  oldPrice:null, rating:4.7, img:"https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80", badge:null,
    desc:"A heavyweight canvas tote built for daily errands and weekend markets alike. Reinforced leather straps, interior pocket, brass hardware." },
  { id:2,  name:"Ceramic Pour-Over Set",  category:"Kitchen",    price:42,  oldPrice:54,   rating:4.9, img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", badge:"Sale",
    desc:"Hand-glazed stoneware dripper and mug pairing, designed with a slow, even extraction cone for a cleaner cup." },
  { id:3,  name:"Wool Lounge Throw",      category:"Home",       price:76,  oldPrice:null, rating:4.6, img:"https://images.unsplash.com/photo-1580301762395-83c3a3a35da1?w=600&q=80", badge:"New",
    desc:"A densely woven merino throw with a fringe edge, kept in a small run of muted, seasonal colorways." },
  { id:4,  name:"Brass Desk Lamp",        category:"Home",       price:96,  oldPrice:null, rating:4.8, img:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80", badge:null,
    desc:"Solid brass task lamp with a warm dimmable LED and a weighted marble base." },
  { id:5,  name:"Leather Card Wallet",    category:"Accessories",price:38,  oldPrice:null, rating:4.5, img:"https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80", badge:null,
    desc:"Full-grain leather wallet that slims down and molds to shape with wear. Holds up to 6 cards plus folded bills." },
  { id:6,  name:"Linen Table Runner",     category:"Kitchen",    price:29,  oldPrice:null, rating:4.4, img:"https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80", badge:null,
    desc:"Stonewashed European linen, pre-shrunk, with a mitered hem that lies flat on any table." },
  { id:7,  name:"Terracotta Planter Trio",category:"Home",       price:34,  oldPrice:45,   rating:4.6, img:"https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80", badge:"Sale",
    desc:"Three nesting planters in raw terracotta, unglazed for natural moisture wicking." },
  { id:8,  name:"Suede Ankle Boots",      category:"Footwear",   price:128, oldPrice:null, rating:4.7, img:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80", badge:"New",
    desc:"Cushioned-sole ankle boots in brushed suede, built on a durable stitched welt for resoling later." },
  { id:9,  name:"Marble Coaster Set",     category:"Home",       price:24,  oldPrice:null, rating:4.3, img:"https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=80", badge:null,
    desc:"Set of four honed marble coasters with a cork underside, each with natural veining." },
  { id:10, name:"Linen Shirt Jacket",     category:"Apparel",    price:88,  oldPrice:null, rating:4.6, img:"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80", badge:null,
    desc:"Mid-weight linen overshirt with a boxy fit and horn buttons, made to layer in every season." },
  { id:11, name:"Stoneware Dinner Set",   category:"Kitchen",    price:110, oldPrice:135,  rating:4.8, img:"https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80", badge:"Sale",
    desc:"Four-piece place setting in a matte reactive glaze — no two pieces glaze exactly alike." },
  { id:12, name:"Woven Storage Basket",   category:"Home",       price:46,  oldPrice:null, rating:4.5, img:"https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80", badge:null,
    desc:"Hand-woven seagrass basket with reinforced leather handles, sized for blankets or firewood." },
];

function getProductById(id){
  return PRODUCTS.find(p => p.id === Number(id));
}
