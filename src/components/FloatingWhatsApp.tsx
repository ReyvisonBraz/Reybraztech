export const FloatingWhatsApp = () => {
    return (
        <>
            <a href="https://wa.me/559191715764?text=Testar!" className="wa-float-img-circle" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn.sendpulse.com/img/messengers/sp-i-small-forms-wa.svg" alt="WhatsApp" />
            </a>
            <style>{`
                .wa-float-img-circle { width: 56px; height: 56px; bottom: 20px; left: 20px; border-radius: 100%; position: fixed; z-index: 99999; display: flex; transition: all .3s; align-items: center; justify-content: center; background: #25D366; } 
                .wa-float-img-circle img { position: relative; } 
                .wa-float-img-circle:before { position: absolute; content: ''; background-color: #25D366; width: 70px; height: 70px; bottom: -7px; left: -7px; border-radius: 100%; animation: wa-float-circle-fill-anim 2.3s infinite ease-in-out; transform-origin: center; opacity: .2; } 
                .wa-float-img-circle:hover{ box-shadow: 0px 3px 16px #24af588a; } 
                .wa-float-img-circle:focus{ box-shadow: 0px 0 0 3px #25d36645; } 
                .wa-float-img-circle:hover:before, .wa-float-img-circle:focus:before{ display: none; } 
                @keyframes wa-float-circle-fill-anim { 0% { transform: rotate(0deg) scale(0.7) skew(1deg); } 50% { transform: rotate(0deg) scale(1) skew(1deg); } 100% { transform: rotate(0deg) scale(0.7) skew(1deg); } }
            `}</style>
        </>
    );
};
