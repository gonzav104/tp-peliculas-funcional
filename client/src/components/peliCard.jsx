// Recibimos la película como "prop"
export const MovieCard = ({ peli }) => {
    return (
        <div className="tarjeta-pelicula">
            <img src={peli.imagen} alt={peli.titulo} className="poster" />
            <div className="info">
                <h3>{peli.titulo}</h3>
                <span className="rating">⭐ {peli.rating.toFixed(1)}</span>
                <p className="fecha">{peli.fecha}</p>
            </div>
        </div>
    );
};