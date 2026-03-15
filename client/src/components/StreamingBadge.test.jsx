import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StreamingBadge } from './StreamingBadge';

describe('StreamingBadge', () => {

    it('No renderiza nada si streaming es null', () => {
        const { container } = render(<StreamingBadge streaming={null} />);
        expect(container.innerHTML).toBe('');
    });

    it('No renderiza nada si streaming es undefined', () => {
        const { container } = render(<StreamingBadge streaming={undefined} />);
        expect(container.innerHTML).toBe('');
    });

    it('No renderiza nada si ambos arrays están vacíos', () => {
        const { container } = render(
            <StreamingBadge streaming={{ suscripcion: [], compra: [] }} />
        );
        expect(container.innerHTML).toBe('');
    });

    it('Muestra badges de suscripción', () => {
        const streaming = {
            suscripcion: [
                { id: 8, nombre: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/test.jpg' }
            ],
            compra: []
        };

        render(<StreamingBadge streaming={streaming} />);

        expect(screen.getByText('Netflix')).toBeInTheDocument();
        expect(screen.getByText('Disponible en')).toBeInTheDocument();
        expect(screen.getByText('Suscripción')).toBeInTheDocument();
        expect(screen.getByAltText('Netflix')).toHaveAttribute(
            'src',
            'https://image.tmdb.org/t/p/original/test.jpg'
        );
    });

    it('Muestra badges de compra', () => {
        const streaming = {
            suscripcion: [],
            compra: [
                { id: 350, nombre: 'Apple TV', logo: 'https://image.tmdb.org/t/p/original/apple.jpg' }
            ]
        };

        render(<StreamingBadge streaming={streaming} />);

        expect(screen.getByText('Apple TV')).toBeInTheDocument();
        expect(screen.getByText('Compra')).toBeInTheDocument();
    });

    it('No muestra duplicados', () => {
        const streaming = {
            suscripcion: [
                { id: 8, nombre: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/nf.jpg' },
                { id: 8, nombre: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/nf.jpg' }
            ],
            compra: []
        };

        render(<StreamingBadge streaming={streaming} />);

        // Debe aparecer solo una vez
        const badges = screen.getAllByText('Netflix');
        expect(badges).toHaveLength(1);
    });

    it('Muestra ambos grupos cuando hay datos en ambos', () => {
        const streaming = {
            suscripcion: [
                { id: 8, nombre: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/nf.jpg' }
            ],
            compra: [
                { id: 350, nombre: 'Apple TV', logo: 'https://image.tmdb.org/t/p/original/apple.jpg' }
            ]
        };

        render(<StreamingBadge streaming={streaming} />);

        // Ambos labels de grupo visibles
        expect(screen.getByText('Suscripción')).toBeInTheDocument();
        expect(screen.getByText('Compra')).toBeInTheDocument();

        // Ambos proveedores visibles
        expect(screen.getByText('Netflix')).toBeInTheDocument();
        expect(screen.getByText('Apple TV')).toBeInTheDocument();
    });

});
