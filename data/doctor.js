// src/data/doctor.js
import { FaCalendarAlt, FaInstagram, FaWhatsapp, FaRegEnvelope } from 'react-icons/fa';

export const doctorData = {
  name: "E-Bio-link",
  specialty: "",
  license: "",
  message: "e-bio-link te ayuda a conectar con tus pacientes de manera fácil y rápida. ¡Agenda tu consulta hoy mismo!",
  avatar: "/avatar.png",
  insurances: ["", "", ""],

  colors: {
    // El color de fondo exacto de la imagen
    background: "#0a0a0aff", 
    // Color para el texto blanco
    text: "#ffffff",
    // Color para los bordes de los botones
    buttonBorder: "#ffffff", 
    // Color sutil para la línea separadora (un azul más claro)
    separator: "#6ba1f2"
  },

  links: [
    { 
      label: "whatsapp", 
      url: "https://wa.me/5492995558764", 
      // Usamos un icono genérico, puedes cambiarlo
      icon: <FaWhatsapp size={18} />, 
    },
    { 
      label: "Instagram", 
      url: "https://www.instagram.com/ebiolink?igsh=cXNoYnhqOHc1czgx", 
      icon: <FaInstagram size={18} />,
    },
    { 
      label: "quienes somos", 
      url: "https://www.google.com/maps", 
      icon: <FaRegEnvelope size={18} />,
    },
  ],

  calLink: "usuario-prueba/consulta-general" 
};
