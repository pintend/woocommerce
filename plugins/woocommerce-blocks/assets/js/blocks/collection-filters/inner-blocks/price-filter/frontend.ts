/**
 * External dependencies
 */
import { store, navigate, getContext } from '@woocommerce/interactivity';
import { formatPrice, getCurrency } from '@woocommerce/price-format';
import { HTMLElementEvent } from '@woocommerce/types';

/**
 * Internal dependencies
 */
import type { PriceFilterContext, PriceFilterStore } from './types';

const getUrl = ( context: PriceFilterContext ) => {
	const { minPrice, maxPrice, minRange, maxRange } = context;
	const url = new URL( window.location.href );
	const { searchParams } = url;

	if ( minPrice > minRange ) {
		searchParams.set( 'min_price', minPrice.toString() );
	} else {
		searchParams.delete( 'min_price' );
	}

	if ( maxPrice < maxRange ) {
		searchParams.set( 'max_price', maxPrice.toString() );
	} else {
		searchParams.delete( 'max_price' );
	}

	searchParams.forEach( ( _, key ) => {
		if ( /query-[0-9]+-page/.test( key ) ) searchParams.delete( key );
	} );

	return url.href;
};

store< PriceFilterStore >( 'woocommerce/collection-price-filter', {
	state: {
		rangeStyle: () => {
			const { minPrice, maxPrice, minRange, maxRange } =
				getContext< PriceFilterContext >();

			return [
				`--low: ${
					( 100 * ( minPrice - minRange ) ) / ( maxRange - minRange )
				}%`,
				`--high: ${
					( 100 * ( maxPrice - minRange ) ) / ( maxRange - minRange )
				}%`,
			].join( ';' );
		},
		formattedMinPrice: () => {
			const { minPrice } = getContext< PriceFilterContext >();
			return formatPrice( minPrice, getCurrency( { minorUnit: 0 } ) );
		},
		formattedMaxPrice: () => {
			const { maxPrice } = getContext< PriceFilterContext >();
			return formatPrice( maxPrice, getCurrency( { minorUnit: 0 } ) );
		},
	},
	actions: {
		updateProducts: ( event: HTMLElementEvent< HTMLInputElement > ) => {
			const { minRange, minPrice, maxPrice, maxRange } =
				getContext< PriceFilterContext >();
			const type = event.target.name;
			const value = parseFloat( event.target.value );

			navigate(
				getUrl( {
					minRange,
					maxRange,
					minPrice:
						type === 'min'
							? Math.min(
									Number.isNaN( value ) ? minRange : value,
									maxRange - 1
							  )
							: minPrice,
					maxPrice:
						type === 'max'
							? Math.max(
									Number.isNaN( value ) ? maxRange : value,
									minRange + 1
							  )
							: maxPrice,
				} )
			);
		},
		reset: () => {
			navigate(
				getUrl( {
					minRange: 0,
					maxRange: 0,
					minPrice: 0,
					maxPrice: 0,
				} )
			);
		},
	},
} );
