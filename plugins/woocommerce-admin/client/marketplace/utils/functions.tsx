/**
 * Internal dependencies
 */
import { Product } from '../components/product-list-content/product-list-content';
import { MARKETPLACE_URL } from '../components/constants';

interface ProductGroup {
	id: number;
	title: string;
	items: Product[];
	url: string;
}

// Fetch data for the discover page from the WooCommerce.com API
const fetchDiscoverPageData = async (): Promise< Array< ProductGroup > > => {
	const fetchUrl = MARKETPLACE_URL + '/wp-json/wccom-extensions/2.0/featured';

	return fetch( fetchUrl )
		.then( ( response ) => {
			if ( ! response.ok ) {
				throw new Error( response.statusText );
			}
			return response.json();
		} )
		.then( ( json ) => {
			return json;
		} )
		.catch( () => {
			return [];
		} );
};

export { fetchDiscoverPageData, ProductGroup };