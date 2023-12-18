<?php
/**
 * WooCommerce Product Block Editor
 */

namespace Automattic\WooCommerce\Internal\Admin\Features\ProductBlockEditor;

/**
 * The Product Template that represents the relation between the Product and
 * the LayoutTemplate (ProductFormTemplateInterface)
 *
 * @see ProductFormTemplateInterface
 */
class ProductTemplate {
	/**
	 * The template id.
	 *
	 * @var string
	 */
	private $id;

	/**
	 * The template title.
	 *
	 * @var string
	 */
	private $title;

	/**
	 * The product data.
	 *
	 * @var array
	 */
	private $product_data;

	/**
	 * The template order.
	 *
	 * @var Integer
	 */
	private $order = 999;

	/**
	 * The layout template id.
	 *
	 * @var string
	 */
	private $layout_template_id = null;

	/**
	 * The template description.
	 *
	 * @var string
	 */
	private $description = null;

	/**
	 * The template icon.
	 *
	 * @var string
	 */
	private $icon = null;

	/**
	 * ProductTemplate constructor
	 *
	 * @param array $data The data.
	 */
	public function __construct( array $data ) {
		$this->id                 = $data['id'];
		$this->title              = $data['title'];
		$this->product_data       = $data['product_data'];
		$this->order              = $data['order'];
		$this->layout_template_id = $data['layout_template_id'];
		$this->description        = $data['description'];
		$this->icon               = $data['icon'];
	}

	/**
	 * Get the pattern ID.
	 *
	 * @return string The ID.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Get the pattern title.
	 *
	 * @return string The title.
	 */
	public function get_title() {
		return $this->title;
	}

	/**
	 * Get the layout template ID.
	 *
	 * @return string The layout template ID.
	 */
	public function get_layout_template_id() {
		return $this->layout_template_id;
	}

	/**
	 * Set the layout template ID.
	 *
	 * @param string $layout_template_id The layout template ID.
	 */
	public function set_layout_template_id( string $layout_template_id ) {
		$this->layout_template_id = $layout_template_id;
	}

	/**
	 * Get the product data.
	 *
	 * @return array The product data.
	 */
	public function get_product_data() {
		return $this->product_data;
	}

	/**
	 * Get the pattern description.
	 *
	 * @return string The description.
	 */
	public function get_description() {
		return $this->description;
	}

	/**
	 * Set the pattern description.
	 *
	 * @param string $description The pattern description.
	 */
	public function set_description( string $description ) {
		$this->description = $description;
	}

	/**
	 * Get the pattern icon.
	 *
	 * @return string The icon.
	 */
	public function get_icon() {
		return $this->icon;
	}

	/**
	 * Set the pattern icon.
	 *
	 * @param string $icon The pattern icon.
	 */
	public function set_icon( string $icon ) {
		$this->icon = $icon;
	}

	/**
	 * Get the pattern order.
	 *
	 * @return int The order.
	 */
	public function get_order() {
		return $this->order;
	}

	/**
	 * Set the pattern order.
	 *
	 * @param int $order The pattern order.
	 */
	public function set_order( int $order ) {
		$this->order = $order;
	}

	/**
	 * Get the product template as JSON like.
	 *
	 * @return array The JSON.
	 */
	public function to_json() {
		return array(
			'id'               => $this->get_id(),
			'title'            => $this->get_title(),
			'description'      => $this->get_description(),
			'icon'             => $this->get_icon(),
			'order'            => $this->get_order(),
			'layoutTemplateId' => $this->get_layout_template_id(),
			'productData'      => $this->get_product_data(),
		);
	}
}
