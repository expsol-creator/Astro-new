"use client";
import React, { useState } from "react";

const translations = {
  en: {
    birthData: "Birth Data",
    heritage: "Heritage",
    print: "Print",
    show: "Show",
    stop: "STOP",
    cancel: "Cancel",
    settings: "Settings",
    selectLanguage: "Select Language",
    english: "English",
    hindi: "Hindi",
    selectStyle: "Select Style",
    selectModel: "Select Model",
    birth01: "Birth 0.1",
    name: "Name",
    sex: "Sex",
    male: "Male",
    female: "Female",
    city: "City",
    dateOfBirth: "Date of Birth",
    now: "Now",
    place: "Place",
    time: "Time",
    hour: "Hour",
    ghati: "Ghati",
    latitude: "Latitude",
    country: "Country",
    longitude: "Longitude",
    state: "State",
    zone: "Zone",
    first: "<< First",
    prev: "< Prev",
    next: "Next >",
    last: "Last >>",
    delete: "Delete",
    save: "Save",
    new: "New",
    find: "Find",
    // ...add more as needed
  },
  hi: {
    birthData: "जन्म डेटा",
    heritage: "विरासत",
    print: "प्रिंट",
    show: "दिखाएँ",
    stop: "रोकें",
    cancel: "रद्द करें",
    settings: "सेटिंग्स",
    selectLanguage: "भाषा चुनें",
    english: "अंग्रेज़ी",
    hindi: "हिंदी",
    selectStyle: "शैली चुनें",
    selectModel: "मॉडल चुनें",
    birth01: "जन्म 0.1",
    name: "नाम",
    sex: "लिंग",
    male: "पुरुष",
    female: "महिला",
    city: "शहर",
    dateOfBirth: "जन्म तिथि",
    now: "अब",
    place: "स्थान",
    time: "समय",
    hour: "घंटा",
    ghati: "घटी",
    latitude: "अक्षांश",
    country: "देश",
    longitude: "देशांतर",
    state: "राज्य",
    zone: "क्षेत्र",
    first: "<< पहला",
    prev: "< पिछला",
    next: "अगला >",
    last: "अंतिम >>",
    delete: "हटाएँ",
    save: "सहेजें",
    new: "नया",
    find: "खोजें",
    // ...add more as needed
  }
};

const delhiPlaces = [
  "India Gate",
  "Red Fort (Lal Qila)",
  "Qutub Minar",
  "Lotus Temple",
  "Akshardham Temple",
  "Jama Masjid",
  "Humayun’s Tomb",
  "Rashtrapati Bhavan",
  "Parliament House",
  "Raj Ghat",
  "Connaught Place",
  "Chandni Chowk",
  "Lodi Garden",
  "Hauz Khas Village",
  "Agrasen ki Baoli",
  "Jantar Mantar",
  "National Museum",
  "National Rail Museum",
  "ISKCON Temple",
  "Purana Qila (Old Fort)",
  "Safdarjung Tomb",
  "Sarojini Nagar Market",
  "Dilli Haat",
  "Nehru Planetarium",
  "Garden of Five Senses"
];

const mumbaiPlaces = [
  "Gateway of India",
  "Marine Drive",
  "Chhatrapati Shivaji Maharaj Terminus (CST)",
  "Elephanta Caves",
  "Haji Ali Dargah",
  "Siddhivinayak Temple",
  "Juhu Beach",
  "Girgaum Chowpatty",
  "Colaba Causeway Market",
  "Bandra-Worli Sea Link",
  "Chor Bazaar",
  "Crawford Market",
  "Mani Bhavan (Gandhi Museum)",
  "Film City (Goregaon)",
  "Sanjay Gandhi National Park",
  "Kanheri Caves",
  "Taraporewala Aquarium",
  "Nehru Planetarium",
  "Jehangir Art Gallery",
  "Prithvi Theatre",
  "ISKCON Temple Juhu",
  "High Street Phoenix Mall",
  "Powai Lake",
  "Aarey Milk Colony",
  "Global Vipassana Pagoda"
];

const Kundali = () => {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("25.44N");
  const [longitude, setLongitude] = useState("82.41E");
  const [zone, setZone] = useState("5.3");
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [sex, setSex] = useState("male");
  const [language, setLanguage] = useState("en");
  const [city, setCity] = useState("Jaunpur");

  const t = translations[language];

  // Reset all fields to initial values
  const handleDelete = () => {
    setName("");
    setLatitude("25.44N");
    setLongitude("82.41E");
    setZone("5.3");
    setDob("");
    setTime("");
    setSex("male");
    setCity("Jaunpur");
    // ...add reset for any other controlled fields if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-red-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-red-800 underline">{t.birthData}</h1>
        <div className="flex gap-2">
          <button className="bg-pink-200 border border-pink-400 rounded-full px-4 py-2 font-semibold text-black focus:outline-none">{t.heritage}</button>
          <button className="bg-pink-200 border border-pink-400 rounded-full px-4 py-2 font-semibold text-black focus:outline-none">{t.print}</button>
          <button className="bg-pink-200 border border-pink-400 rounded-full px-4 py-2 font-semibold text-black focus:outline-none">{t.show}</button>
          <button className="bg-red-700 border border-red-900 rounded-full px-4 py-2 font-semibold text-white focus:outline-none flex items-center gap-1">
            <span className="bg-red-900 rounded-full px-2 py-1 text-xs font-bold">{t.stop}</span>
            {t.cancel}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white/80 border border-pink-300 rounded-2xl p-5 mb-6 shadow-lg">
        <div className="text-xl font-extrabold text-pink-700 mb-3 tracking-wide flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-pink-400 rounded-full"></span>
          {t.settings}
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Language selection */}
          <select
            className="border border-pink-300 rounded-lg px-3 py-2 text-pink-900 bg-white/90 shadow-sm focus:ring-2 focus:ring-pink-300 transition-all"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            <option value="en">{t.english}</option>
            <option value="hi">{t.hindi}</option>
          </select>
          <select className="border border-pink-300 rounded-lg px-3 py-2 text-pink-900 bg-white/90 shadow-sm focus:ring-2 focus:ring-pink-300 transition-all">
            <option>{t.selectStyle}</option>
          </select>
          <select className="border border-pink-300 rounded-lg px-3 py-2 text-pink-900 bg-white/90 shadow-sm focus:ring-2 focus:ring-pink-300 transition-all">
            <option>{t.selectModel}</option>
            <option>{t.birth01}</option>
          </select>
        </div>
      </div>

      {/* Form */}
      <form className="bg-white bg-opacity-60 rounded-lg shadow p-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {/* Name */}
          <label className="col-span-2 flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-32">{t.name}</span>
            <input
              type="text"
              className="flex-1 border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-xl outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={language === "en" ? "Enter your name" : "अपना नाम दर्ज करें"}
            />
          </label>
          {/* Sex */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-32">{t.sex}</span>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="sex"
                value="male"
                checked={sex === "male"}
                onChange={() => setSex("male")}
                className="accent-pink-600"
              />
              <span className="text-lg text-blue-900">{t.male}</span>
            </label>
            <label className="flex items-center gap-1 ml-4">
              <input
                type="radio"
                name="sex"
                value="female"
                checked={sex === "female"}
                onChange={() => setSex("female")}
                className="accent-pink-600"
              />
              <span className="text-lg text-blue-900">{t.female}</span>
            </label>
          </div>
          {/* City */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-16">{t.city}</span>
            <select
              className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none"
              value={city}
              onChange={e => setCity(e.target.value)}
            >
              <option>Jaunpur</option>
              <option>Delhi</option>
              <option>Mumbai</option>
              <option>Kolkata</option>
              <option>Chennai</option>
              <option>Bengaluru</option>
              <option>Hyderabad</option>
              <option>Ahmedabad</option>
              <option>Pune</option>
              <option>Jaipur</option>
              <option>Lucknow</option>
              <option>Bhopal</option>
              <option>Indore</option>
              <option>Nagpur</option>
              <option>Surat</option>
              <option>Coimbatore</option>
              <option>Kochi</option>
              <option>Chandigarh</option>
              <option>Bhubaneswar</option>
              <option>Amritsar</option>
              <option>Ludhiana</option>
              <option>Dehradun</option>
              <option>Agra</option>
              <option>Varanasi</option>
              <option>Noida</option>
              <option>Ghaziabad</option>
              <option>Faridabad</option>
              <option>Madurai</option>
              <option>Mangaluru</option>
              <option>Vijayawada</option>
              <option>Visakhapatnam</option>
              <option>Mysuru</option>
              <option>Tiruchirappalli</option>
              <option>Thiruvananthapuram</option>
              <option>Nashik</option>
              <option>Rajkot</option>
              <option>Vadodara</option>
              <option>Udaipur</option>
              <option>Aurangabad</option>
              <option>Patna</option>
              <option>Ranchi</option>
              <option>Dhanbad</option>
              <option>Guwahati</option>
              <option>Siliguri</option>
              <option>Gwalior</option>
              <option>Jabalpur</option>
              <option>Raipur</option>
              <option>Bilaspur</option>
              <option>Shimla</option>
              <option>Manali</option>
              <option>Nainital</option>
            </select>
          </div>
          {/* Date of Birth */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-32">{t.dateOfBirth}</span>
            <span className="text-xs text-gray-500">{t.now}</span>
            <input
              type="date"
              className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none w-48"
              value={dob}
              onChange={e => setDob(e.target.value)}
              placeholder={language === "en" ? "DD/MM/YYYY" : "दिन/माह/वर्ष"}
            />
          </div>
          {/* Place */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-16">{t.place}</span>
            <select className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none">
              {city === "Delhi"
                ? delhiPlaces.map(place => (
                    <option key={place}>{place}</option>
                  ))
                : city === "Mumbai"
                ? mumbaiPlaces.map(place => (
                    <option key={place}>{place}</option>
                  ))
                : <option>Jaunpur</option>
              }
            </select>
          </div>
          {/* Time */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-32">{t.time}</span>
            <span className="text-xs text-blue-700">{t.hour}</span>
            <span className="text-xs text-blue-700">{t.ghati}</span>
            <span className="text-xs text-gray-500">{t.now}</span>
            <input
              type="time"
              className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none w-32"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder={language === "en" ? "HH:MM" : "घंटा:मिनट"}
            />
          </div>
          {/* Latitude */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-24">{t.latitude}</span>
            <input
              type="text"
              className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none w-24"
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
              placeholder={language === "en" ? "e.g. 25.44N" : "जैसे 25.44N"}
            />
          </div>
          {/* Country */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-32">{t.country}</span>
            <select className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none">
              <option>Afghanistan</option>
              <option>Albania</option>
              <option>Algeria</option>
              <option>Andorra</option>
              <option>Angola</option>
              <option>Argentina</option>
              <option>Armenia</option>
              <option>Australia</option>
              <option>Austria</option>
              <option>Azerbaijan</option>
              <option>Bahamas</option>
              <option>Bahrain</option>
              <option>Bangladesh</option>
              <option>Barbados</option>
              <option>Belarus</option>
              <option>Belgium</option>
              <option>Belize</option>
              <option>Benin</option>
              <option>Bhutan</option>
              <option>Bolivia</option>
              <option>Bosnia and Herzegovina</option>
              <option>Botswana</option>
              <option>Brazil</option>
              <option>Brunei</option>
              <option>Bulgaria</option>
              <option>Burkina Faso</option>
              <option>Burundi</option>
              <option>Cambodia</option>
              <option>Cameroon</option>
              <option>Canada</option>
              <option>Cape Verde</option>
              <option>Central African Republic</option>
              <option>Chad</option>
              <option>Chile</option>
              <option>China</option>
              <option>Colombia</option>
              <option>Comoros</option>
              <option>Congo (Democratic Republic)</option>
              <option>Costa Rica</option>
              <option>Croatia</option>
              <option>Cuba</option>
              <option>Cyprus</option>
              <option>Czech Republic</option>
              <option>Denmark</option>
              <option>Djibouti</option>
              <option>Dominica</option>
              <option>Dominican Republic</option>
              <option>East Timor</option>
              <option>Ecuador</option>
              <option>Egypt</option>
              <option>El Salvador</option>
              <option>Equatorial Guinea</option>
              <option>Eritrea</option>
              <option>Estonia</option>
              <option>Eswatini</option>
              <option>Ethiopia</option>
              <option>Fiji</option>
              <option>Finland</option>
              <option>France</option>
              <option>Gabon</option>
              <option>Gambia</option>
              <option>Georgia</option>
              <option>Germany</option>
              <option>Ghana</option>
              <option>Greece</option>
              <option>Grenada</option>
              <option>Guatemala</option>
              <option>Guinea</option>
              <option>Guinea-Bissau</option>
              <option>Guyana</option>
              <option>Haiti</option>
              <option>Honduras</option>
              <option>Hungary</option>
              <option>Iceland</option>
              <option>India</option>
              <option>Indonesia</option>
              <option>Iran</option>
              <option>Iraq</option>
              <option>Ireland</option>
              <option>Israel</option>
              <option>Italy</option>
              <option>Jamaica</option>
              <option>Japan</option>
              <option>Jordan</option>
              <option>Kazakhstan</option>
              <option>Kenya</option>
              <option>Kiribati</option>
              <option>Korea (North)</option>
              <option>Korea (South)</option>
              <option>Kuwait</option>
              <option>Kyrgyzstan</option>
              <option>Laos</option>
              <option>Latvia</option>
              <option>Lebanon</option>
              <option>Lesotho</option>
              <option>Liberia</option>
              <option>Libya</option>
              <option>Liechtenstein</option>
              <option>Lithuania</option>
              <option>Luxembourg</option>
            </select>
          </div>
          {/* Longitude */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-24">{t.longitude}</span>
            <input
              type="text"
              className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none w-24"
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
              placeholder={language === "en" ? "e.g. 82.41E" : "जैसे 82.41E"}
            />
          </div>
          {/* State */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-32">{t.state}</span>
            <select className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none">
              <option>Andhra Pradesh</option>
              <option>Arunachal Pradesh</option>
              <option>Assam</option>
              <option>Bihar</option>
              <option>Chhattisgarh</option>
              <option>Goa</option>
              <option>Gujarat</option>
              <option>Haryana</option>
              <option>Himachal Pradesh</option>
              <option>Jharkhand</option>
              <option>Karnataka</option>
              <option>Kerala</option>
              <option>Madhya Pradesh</option>
              <option>Maharashtra</option>
              <option>Manipur</option>
              <option>Meghalaya</option>
              <option>Mizoram</option>
              <option>Nagaland</option>
              <option>Odisha</option>
              <option>Punjab</option>
              <option>Rajasthan</option>
              <option>Sikkim</option>
              <option>Tamil Nadu</option>
              <option>Telangana</option>
              <option>Tripura</option>
              <option>Uttar Pradesh</option>
              <option>Uttarakhand</option>
              <option>West Bengal</option>
            </select>
          </div>
          {/* Zone */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-900 w-24">{t.zone}</span>
            <input
              type="text"
              className="border-b-2 border-red-400 bg-transparent text-red-700 font-bold text-lg outline-none w-24"
              value={zone}
              onChange={e => setZone(e.target.value)}
              placeholder={language === "en" ? "e.g. 5.3" : "जैसे 5.3"}
            />
          </div>
        </div>
      </form>

      {/* Navigation & Actions */}
      <div className="flex justify-between items-center mt-8 max-w-3xl mx-auto">
        <div className="flex gap-2">
          <button className="bg-pink-200 border border-pink-400 rounded px-3 py-1 font-bold text-blue-900">{t.first}</button>
          <button className="bg-pink-200 border border-pink-400 rounded px-3 py-1 font-bold text-blue-900">{t.prev}</button>
          <button className="bg-pink-200 border border-pink-400 rounded px-3 py-1 font-bold text-blue-900">{t.next}</button>
          <button className="bg-pink-200 border border-pink-400 rounded px-3 py-1 font-bold text-blue-900">{t.last}</button>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-red-600 border border-red-800 rounded-full px-4 py-2 font-bold text-white flex items-center gap-1"
            onClick={e => {
              e.preventDefault();
              handleDelete();
            }}
            type="button"
          >
            <span className="text-xl">✖</span> {t.delete}
          </button>
          <button className="bg-pink-200 border border-pink-400 rounded-full px-4 py-2 font-bold text-blue-900 flex items-center gap-1">
            <span className="text-xl">💾</span> {t.save}
          </button>
          <button className="bg-pink-200 border border-pink-400 rounded-full px-4 py-2 font-bold text-blue-900 flex items-center gap-1">
            <span className="text-xl">📄</span> {t.new}
          </button>
          <button className="bg-pink-200 border border-pink-400 rounded-full px-4 py-2 font-bold text-blue-900 flex items-center gap-1">
            <span className="text-xl">🔍</span> {t.find}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Kundali;
