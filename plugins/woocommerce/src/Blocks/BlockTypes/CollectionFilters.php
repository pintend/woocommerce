<?php
namespace Automattic\WooCommerce\Blocks\BlockTypes;

use Automattic\WooCommerce\Blocks\QueryFilters;
use Automattic\WooCommerce\Blocks\Package;

/**
 * CollectionFilters class.
 */
final class CollectionFilters extends AbstractBlock {
	/**
	 * Block name.
	 *
	 * @var string
	 */
	protected $block_name = 'collection-filters';

	/**
	 * Cache the current response from the API.
	 *
	 * @var array
	 */
	private $current_response = null;

	/**
	 * Get the frontend style handle for this block type.
	 *
	 * @return null
	 */
	protected function get_block_type_style() {
		return null;
	}

	/**
	 * Get the frontend script handle for this block type.
	 *
	 * @see $this->register_block_type()
	 * @param string $key Data to get, or default to everything.
	 * @return array|string|null
	 */
	protected function get_block_type_script( $key = null ) {
		return null;
	}

	/**
	 * Initialize this block type.
	 *
	 * - Hook into WP lifecycle.
	 * - Register the block with WordPress.
	 */
	protected function initialize() {
		parent::initialize();
		add_action( 'render_block_context', array( $this, 'modify_inner_blocks_context' ), 10, 3 );
	}

	/**
	 * Extra data passed through from server to client for block.
	 *
	 * @param array $attributes  Any attributes that currently are available from the block.
	 *                           Note, this will be empty in the editor context when the block is
	 *                           not in the post content on editor load.
	 */
	protected function enqueue_data( array $attributes = array() ) {
		parent::enqueue_data( $attributes );

		if ( ! is_admin() ) {
			/**
			 * At this point, WP starts rendering the Collection Filters block,
			 * we can safely unset the current response.
			 */
			$this->current_response = null;
		}
	}

	/**
	 * Modify the context of inner blocks.
	 *
	 * @param array    $context The block context.
	 * @param array    $parsed_block The parsed block.
	 * @param WP_Block $parent_block The parent block.
	 * @return array
	 */
	public function modify_inner_blocks_context( $context, $parsed_block, $parent_block ) {
		if ( is_admin() || ! is_a( $parent_block, 'WP_Block' ) ) {
			return $context;
		}

		/**
		 * When the first direct child of Collection Filters is rendering, we
		 * hydrate and cache the collection data response.
		 */
		if (
			"woocommerce/{$this->block_name}" === $parent_block->name &&
			! isset( $this->current_response )
		) {
			$this->current_response = $this->get_aggregated_collection_data( $parent_block );
		}

		if ( empty( $this->current_response ) ) {
			return $context;
		}

		/**
		 * Filter blocks use the collectionData context, so we only update that
		 * specific context with fetched data.
		 */
		if ( isset( $context['collectionData'] ) ) {
			$context['collectionData'] = $this->current_response;
		}

		return $context;
	}

	/**
	 * Get the aggregated collection data from the API.
	 * Loop through inner blocks and build a query string to pass to the API.
	 *
	 * @param WP_Block $block The block instance.
	 * @return array
	 */
	private function get_aggregated_collection_data( $block ) {
		$collection_data_params = $this->get_inner_collection_data_params( $block->inner_blocks );

		if ( empty( array_filter( $collection_data_params ) ) ) {
			return array();
		}

		$data = array(
			'min_price'           => null,
			'max_price'           => null,
			'attribute_counts'    => null,
			'stock_status_counts' => null,
			'rating_counts'       => null,
		);

		$filters = Package::container()->get( QueryFilters::class );

		if ( ! empty( $block->context['query'] ) && ! $block->context['query']['inherit'] ) {
			$query_vars = build_query_vars_from_query_block( $block, 1 );
		} else {
			global $wp_query;
			$query_vars = array_filter( $wp_query->query_vars );
		}

		if ( ! empty( $collection_data_params['calculate_price_range'] ) ) {
			$filter_query_vars = $query_vars;
			unset( $filter_query_vars['min_price'], $filter_query_vars['max_price'] );

			$price_results       = $filters->get_filtered_price( $filter_query_vars );
			$data['price_range'] = array(
				'min_price' => intval( floor( $price_results->min_price ) ),
				'max_price' => intval( ceil( $price_results->max_price ) ),
			);
		}

		if ( ! empty( $collection_data_params['calculate_stock_status_counts'] ) ) {
			$filter_query_vars = $query_vars;
			unset( $filter_query_vars['filter_stock_status'] );

			$counts = $filters->get_stock_status_counts( $filter_query_vars );

			$data['stock_status_counts'] = array();

			foreach ( $counts as $key => $value ) {
				$data['stock_status_counts'][] = array(
					'status' => $key,
					'count'  => $value,
				);
			}
		}

		if ( ! empty( $collection_data_params['calculate_rating_counts'] ) ) {
			// Regenerate the products query vars without rating filter.
			$filter_query_vars = $query_vars;

			if ( ! empty( $filter_query_vars['tax_query'] ) ) {
				foreach ( $filter_query_vars['tax_query'] as $key => $tax_query ) {
					if ( isset( $tax_query['rating_filter'] ) && $tax_query['rating_filter'] ) {
						unset( $filter_query_vars['tax_query'][ $key ] );
					}
				}
			}

			$counts                = $filters->get_rating_counts( $filter_query_vars );
			$data['rating_counts'] = array();

			foreach ( $counts as $key => $value ) {
				$data['rating_counts'][] = array(
					'rating' => $key,
					'count'  => $value,
				);
			}
		}

		if ( ! empty( $collection_data_params['calculate_attribute_counts'] ) ) {
			foreach ( $collection_data_params['calculate_attribute_counts'] as $attributes_to_count ) {
				if ( ! isset( $attributes_to_count['taxonomy'] ) ) {
					continue;
				}

				$filter_query_vars = $query_vars;
				unset( $filter_query_vars[ 'filter_' . str_replace( 'pa_', '', $attributes_to_count['taxonomy'] ) ] );
				unset( $filter_query_vars['taxonomy'] );
				unset( $filter_query_vars['terms'] );
				foreach ( $filter_query_vars['tax_query'] as $key => $tax_query ) {
					if ( is_array( $tax_query ) && $tax_query['taxonomy'] === $attributes_to_count['taxonomy'] ) {
						unset( $filter_query_vars['tax_query'][ $key ] );
					}
				}

				$counts = $filters->get_attribute_counts( $filter_query_vars, $attributes_to_count['taxonomy'] );

				foreach ( $counts as $key => $value ) {
					$data['attribute_counts'][] = array(
						'term'  => $key,
						'count' => $value,
					);
				}
			}
		}

		return $data;
	}

	/**
	 * Get all inner blocks recursively.
	 *
	 * @param WP_Block_List $inner_blocks The block to get inner blocks from.
	 * @param array         $results      The results array.
	 *
	 * @return array
	 */
	private function get_inner_collection_data_params( $inner_blocks, &$results = array() ) {
		if ( is_a( $inner_blocks, 'WP_Block_List' ) ) {
			foreach ( $inner_blocks as $inner_block ) {
				if ( ! empty( $inner_block->attributes['queryParam'] ) ) {
					$query_param = $inner_block->attributes['queryParam'];
					/**
					 * There can be multiple attribute filters so we transform
					 * the query param of each filter into an array to merge
					 * them together.
					 */
					if ( ! empty( $query_param['calculate_attribute_counts'] ) ) {
						$query_param['calculate_attribute_counts'] = array( $query_param['calculate_attribute_counts'] );
					}
					$results = array_merge_recursive( $results, $query_param );
				}
				$this->get_inner_collection_data_params(
					$inner_block->inner_blocks,
					$results
				);
			}
		}

		return $results;
	}

}
