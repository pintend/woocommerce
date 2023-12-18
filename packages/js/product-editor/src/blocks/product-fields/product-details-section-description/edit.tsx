/**
 * External dependencies
 */
import classNames from 'classnames';
import {
	Button,
	Dropdown,
	Fill,
	MenuGroup,
	MenuItem,
	Modal,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	createElement,
	createInterpolateElement,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import * as icons from '@wordpress/icons';
import { useWooBlockProps } from '@woocommerce/block-templates';
import { Product } from '@woocommerce/data';
import { getNewPath } from '@woocommerce/navigation';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore No types for this exist yet.
// eslint-disable-next-line @woocommerce/dependency-group
import { useEntityId } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { ProductEditorSettings } from '../../../components';
import { ProductTemplate } from '../../../components/editor';
import { useValidations } from '../../../contexts/validation-context';
import {
	WPError,
	getProductErrorMessage,
} from '../../../utils/get-product-error-message';
import { ProductEditorBlockEditProps } from '../../../types';
import { ProductDetailsSectionDescriptionBlockAttributes } from './types';

export function ProductDetailsSectionDescriptionBlockEdit( {
	attributes,
	clientId,
}: ProductEditorBlockEditProps< ProductDetailsSectionDescriptionBlockAttributes > ) {
	const blockProps = useWooBlockProps( attributes );

	const { productTemplates, productTemplate: selectedProductTemplate } =
		useSelect( ( select ) => {
			const { getEditorSettings } = select( 'core/editor' );
			return getEditorSettings() as ProductEditorSettings;
		} );

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const [ supportedProductTemplates, unsupportedProductTemplates ] =
		productTemplates.reduce< [ ProductTemplate[], ProductTemplate[] ] >(
			( [ supported, unsupported ], productTemplate ) => {
				if ( productTemplate.layoutTemplateId ) {
					supported.push( productTemplate );
				} else {
					unsupported.push( productTemplate );
				}
				return [ supported, unsupported ];
			},
			[ [], [] ]
		);

	const productId = useEntityId( 'postType', 'product' );

	const { validate } = useValidations< Product >();
	// @ts-expect-error There are no types for this.
	const { editEntityRecord, saveEditedEntityRecord, saveEntityRecord } =
		useDispatch( 'core' );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( 'core/notices' );

	const rootClientId = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( 'core/block-editor' );
			return getBlockRootClientId( clientId );
		},
		[ clientId ]
	);

	const [ unsupportedProductTemplate, setUnsupportedProductTemplate ] =
		useState< ProductTemplate >();

	if ( ! rootClientId ) return;

	function menuItemClickHandler(
		productTemplate: ProductTemplate,
		onClose: () => void
	) {
		return async function handleMenuItemClick() {
			try {
				if ( ! productTemplate.layoutTemplateId ) {
					setUnsupportedProductTemplate( productTemplate );
					onClose();
					return;
				}

				await validate( productTemplate.productData );

				await editEntityRecord(
					'postType',
					'product',
					productId,
					productTemplate.productData
				);

				await saveEditedEntityRecord< Product >(
					'postType',
					'product',
					productId,
					{
						throwOnError: true,
					}
				);

				createSuccessNotice(
					__( 'Product type changed.', 'woocommerce' )
				);
			} catch ( error ) {
				const message = getProductErrorMessage( error as WPError );
				createErrorNotice( message );
			}

			onClose();
		};
	}

	function resolveIcon( iconName?: string | null ) {
		if ( ! iconName || ! ( iconName in icons ) ) return undefined;

		const { Icon, [ iconName as never ]: icon } = icons;

		return <Icon icon={ icon } size={ 24 } />;
	}

	function getMenuItem( onClose: () => void ) {
		return function renderMenuItem( productTemplate: ProductTemplate ) {
			const isSelected =
				selectedProductTemplate?.id === productTemplate.id;
			return (
				<MenuItem
					key={ productTemplate.id }
					info={ productTemplate.description ?? undefined }
					isSelected={ isSelected }
					icon={
						isSelected
							? resolveIcon( 'check' )
							: resolveIcon( productTemplate.icon )
					}
					iconPosition="left"
					role="menuitemradio"
					onClick={ menuItemClickHandler( productTemplate, onClose ) }
					className={ classNames( {
						'components-menu-item__button--selected': isSelected,
					} ) }
				>
					{ productTemplate.title }
				</MenuItem>
			);
		};
	}

	async function handleModelChangeClick() {
		try {
			await validate( unsupportedProductTemplate?.productData );

			const product = ( await saveEditedEntityRecord< Product >(
				'postType',
				'product',
				productId,
				{
					throwOnError: true,
				}
			) ) ?? { id: productId };

			// Avoiding to save some changes that are not supported by the current product template.
			// So in this case those changes are saved directly to the server.
			await saveEntityRecord(
				'postType',
				'product',
				{
					...product,
					...unsupportedProductTemplate?.productData,
				},
				// @ts-expect-error Expected 3 arguments, but got 4.
				{
					throwOnError: true,
				}
			);

			createSuccessNotice( __( 'Product type changed.', 'woocommerce' ) );

			// Let the server manage the redirection when the product is not supported
			// by the product editor.
			window.location.href = getNewPath( {}, `/product/${ productId }` );
		} catch ( error ) {
			const message = getProductErrorMessage( error as WPError );
			createErrorNotice( message );
		}
	}

	return (
		<Fill name={ rootClientId }>
			<div { ...blockProps }>
				<p>
					{ createInterpolateElement(
						/* translators: <ProductTemplate />: the product template. */
						__( 'This is a <ProductTemplate />.', 'woocommerce' ),
						{
							ProductTemplate: (
								<span>
									{ selectedProductTemplate?.title?.toLowerCase() }
								</span>
							),
						}
					) }
				</p>

				<Dropdown
					focusOnMount={ false }
					// @ts-expect-error Property does exists
					popoverProps={ {
						placement: 'bottom-start',
					} }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							aria-expanded={ isOpen }
							variant="link"
							onClick={ onToggle }
						>
							<span>
								{ __( 'Change product type', 'woocommerce' ) }
							</span>
						</Button>
					) }
					renderContent={ ( { onClose } ) => (
						<div className="wp-block-woocommerce-product-details-section-description__dropdown components-dropdown-menu__menu">
							<MenuGroup>
								{ supportedProductTemplates.map(
									getMenuItem( onClose )
								) }
							</MenuGroup>

							{ unsupportedProductTemplates.length > 0 && (
								<MenuGroup>
									<Dropdown
										focusOnMount={ false }
										// @ts-expect-error Property does exists
										popoverProps={ {
											placement: 'right-start',
										} }
										renderToggle={ ( {
											isOpen,
											onToggle,
										} ) => (
											<MenuItem
												aria-expanded={ isOpen }
												icon={ resolveIcon(
													'chevronRight'
												) }
												iconPosition="right"
												onClick={ onToggle }
											>
												<span>
													{ __(
														'More',
														'woocommerce'
													) }
												</span>
											</MenuItem>
										) }
										renderContent={ () => (
											<div className="wp-block-woocommerce-product-details-section-description__dropdown components-dropdown-menu__menu">
												<MenuGroup>
													{ unsupportedProductTemplates.map(
														getMenuItem( onClose )
													) }
												</MenuGroup>
											</div>
										) }
									/>
								</MenuGroup>
							) }
						</div>
					) }
				/>

				{ Boolean( unsupportedProductTemplate ) && (
					<Modal
						title={ __( 'Change product type?', 'woocommerce' ) }
						className="wp-block-woocommerce-product-details-section-description__modal"
						onRequestClose={ () => {
							setUnsupportedProductTemplate( undefined );
						} }
					>
						<p>
							<b>
								{ __(
									'This product type isn’t supported by the updated product editing experience yet.',
									'woocommerce'
								) }
							</b>
						</p>

						<p>
							{ __(
								'You’ll be taken to the classic editing screen that isn’t optimized for commerce but offers advanced functionality and supports all extensions.',
								'woocommerce'
							) }
						</p>

						<div className="wp-block-woocommerce-product-details-section-description__modal-actions">
							<Button
								variant="secondary"
								onClick={ () => {
									setUnsupportedProductTemplate( undefined );
								} }
							>
								{ __( 'Cancel', 'woocommerce' ) }
							</Button>

							<Button
								variant="primary"
								onClick={ handleModelChangeClick }
							>
								{ __( 'Change', 'woocommerce' ) }
							</Button>
						</div>
					</Modal>
				) }
			</div>
		</Fill>
	);
}
