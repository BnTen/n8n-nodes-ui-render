/* eslint-disable import-x/no-unresolved */
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface IRenderPreset {
	title: string;
	subtitle: string;
	theme: string;
	layoutDensity: string;
	accentColor: string;
	backgroundColor: string;
	textColor: string;
	showHeader: boolean;
	showKpiSection: boolean;
	showFooter: boolean;
	footerText: string;
}

interface IStyleConfig {
	theme: string;
	accentColor: string;
	backgroundColor: string;
	cardBackgroundColor: string;
	textColor: string;
	fontFamily: string;
	layoutDensity: string;
	cardRadius: number;
	enableShadow: boolean;
}

interface ISectionConfig {
	showHeader: boolean;
	showKpiSection: boolean;
	showFooter: boolean;
	footerText: string;
}

const PRESET_MAP: Record<string, IRenderPreset> = {
	ExecutiveDashboard: {
		title: 'Executive Dashboard',
		subtitle: 'Weekly business performance overview',
		theme: 'light',
		layoutDensity: 'comfortable',
		accentColor: '#2563eb',
		backgroundColor: '#f8fafc',
		textColor: '#0f172a',
		showHeader: true,
		showKpiSection: true,
		showFooter: true,
		footerText: 'Generated with UiRenderer',
	},
	SalesReport: {
		title: 'Sales Report',
		subtitle: 'Pipeline and conversion metrics',
		theme: 'light',
		layoutDensity: 'compact',
		accentColor: '#2563eb',
		backgroundColor: '#f8fafc',
		textColor: '#111827',
		showHeader: true,
		showKpiSection: true,
		showFooter: true,
		footerText: 'Sales performance report',
	},
	OpsTable: {
		title: 'Operations Snapshot',
		subtitle: 'Operational records and status',
		theme: 'light',
		layoutDensity: 'compact',
		accentColor: '#7c3aed',
		backgroundColor: '#ffffff',
		textColor: '#111827',
		showHeader: true,
		showKpiSection: false,
		showFooter: false,
		footerText: '',
	},
	ActivityFeed: {
		title: 'Activity Feed',
		subtitle: 'Latest events and updates',
		theme: 'dark',
		layoutDensity: 'comfortable',
		accentColor: '#f59e0b',
		backgroundColor: '#0f172a',
		textColor: '#e2e8f0',
		showHeader: true,
		showKpiSection: false,
		showFooter: true,
		footerText: 'End of activity timeline',
	},
};

const BASE_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Template Type',
		name: 'templateType',
		type: 'options',
		default: 'table',
		description: 'Main visualization template',
		displayOptions: { show: { pageCompositionMode: ['single'] } },
		options: [
			{ name: 'Chart', value: 'chart' },
			{ name: 'Chat', value: 'chat' },
			{ name: 'List', value: 'list' },
			{ name: 'LLM Chat Widget (Webhook)', value: 'chatEmbed' },
			{ name: 'Section Text', value: 'sectionText' },
			{ name: 'Table', value: 'table' },
		],
	},
	{
		displayName: 'Input Mode',
		name: 'inputMode',
		type: 'options',
		default: 'aggregateItems',
		description: 'Render one document per item or a single document from all items',
		displayOptions: { show: { pageCompositionMode: ['single'] } },
		options: [
			{ name: 'Aggregate Items', value: 'aggregateItems' },
			{ name: 'Current Item', value: 'currentItem' },
		],
	},
	{
		displayName: 'Preset',
		name: 'preset',
		type: 'options',
		default: 'ExecutiveDashboard',
		description: 'Professional preset used as base style',
		options: [
			{ name: 'Executive Dashboard', value: 'ExecutiveDashboard' },
			{ name: 'Sales Report', value: 'SalesReport' },
			{ name: 'Ops Table', value: 'OpsTable' },
			{ name: 'Activity Feed', value: 'ActivityFeed' },
		],
	},
	{
		displayName: 'Chart Type',
		name: 'chartType',
		type: 'options',
		default: 'bar',
		description: 'Chart style when Template Type is Chart',
		displayOptions: { show: { templateType: ['chart'], pageCompositionMode: ['single'] } },
		options: [
			{ name: 'Bar', value: 'bar' },
			{ name: 'Donut', value: 'donut' },
			{ name: 'Line', value: 'line' },
			{ name: 'Pie', value: 'pie' },
			{ name: 'Polar', value: 'polar' },
		],
	},
	{
		displayName: 'Section Text — Title',
		name: 'sectionTextTitle',
		type: 'string',
		default: '',
		description: 'Title shown inside the section card',
		displayOptions: { show: { templateType: ['sectionText'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Section Text — Paragraph',
		name: 'sectionTextParagraph',
		type: 'string',
		default: '',
		placeholder: 'e.g. This report summarizes {{stats.count}} records...',
		description: 'Paragraph rendered inside the section card. Supports placeholders like {{item.field}}.',
		displayOptions: { show: { templateType: ['sectionText'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat — Messages Field',
		name: 'chatMessagesField',
		type: 'string',
		default: 'messages',
		description: 'Field path inside each input item that contains an array of chat messages',
		displayOptions: { show: { templateType: ['chat'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat — Role Field',
		name: 'chatRoleField',
		type: 'string',
		default: 'role',
		description: 'Message role field (e.g. user/assistant/system)',
		displayOptions: { show: { templateType: ['chat'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat — Content Field',
		name: 'chatContentField',
		type: 'string',
		default: 'content',
		description: 'Message content field',
		displayOptions: { show: { templateType: ['chat'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat — Timestamp Field',
		name: 'chatTimestampField',
		type: 'string',
		default: 'timestamp',
		description: 'Optional message timestamp field (ISO string or any readable value)',
		displayOptions: { show: { templateType: ['chat'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat — User Role Value',
		name: 'chatUserRole',
		type: 'string',
		default: 'user',
		description: 'Value used in roleField for user messages',
		displayOptions: { show: { templateType: ['chat'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat — Assistant Role Value',
		name: 'chatAssistantRole',
		type: 'string',
		default: 'assistant',
		description: 'Value used in roleField for assistant messages',
		displayOptions: { show: { templateType: ['chat'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat — System Role Value',
		name: 'chatSystemRole',
		type: 'string',
		default: 'system',
		description: 'Value used in roleField for system messages',
		displayOptions: { show: { templateType: ['chat'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat Embed — Public URL',
		name: 'chatEmbedUrl',
		type: 'string',
		default: '',
		description: 'Public URL to embed (iframe src). Must be http/https.',
		displayOptions: { show: { templateType: ['chatEmbed'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chat Embed — Height (Px)',
		name: 'chatEmbedHeight',
		type: 'number',
		default: 680,
		typeOptions: { minValue: 200, maxValue: 1200 },
		description: 'Iframe height in pixels',
		displayOptions: { show: { templateType: ['chatEmbed'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Theme',
		name: 'theme',
		type: 'options',
		default: 'light',
		description: 'Page color theme (preset fills in when unchanged)',
		options: [
			{ name: 'Light', value: 'light' },
			{ name: 'Dark', value: 'dark' },
		],
	},
	{
		displayName: 'Layout Density',
		name: 'layoutDensity',
		type: 'options',
		default: 'comfortable',
		description: 'Spacing density for cards and content',
		options: [
			{ name: 'Compact', value: 'compact' },
			{ name: 'Comfortable', value: 'comfortable' },
		],
	},
	{
		displayName: 'UX Configuration',
		name: 'uxConfigMode',
		type: 'options',
		default: 'pro',
		description: 'Pro configuration groups options into CTAs',
		options: [
			{ name: 'Pro', value: 'pro' },
			{ name: 'Legacy', value: 'legacy' },
		],
	},
	{
		displayName: 'Page Composition Mode',
		name: 'pageCompositionMode',
		type: 'options',
		default: 'single',
		description: 'Render a single template or compose multiple blocks on the same page',
		options: [
			{ name: 'Single Template', value: 'single' },
			{ name: 'Multi Blocks', value: 'multi' },
		],
	},
	{
		displayName: 'Blocks (Multi-Page)',
		name: 'blocksUi',
		type: 'fixedCollection',
		placeholder: 'Add block',
		default: {},
		displayOptions: { show: { pageCompositionMode: ['multi'] } },
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		description: 'Add sections (table/list/chart) in order. Used only when Page Composition Mode is Multi Blocks.',
		options: [
			{
				name: 'blocksValues',
				displayName: 'Blocks',
				values: [
					{
						displayName: 'Block	—	Input Mode',
						name: 'blockInputMode',
						type: 'options',
						default: 'aggregateItems',
						options: [
							{
								name: 'Aggregate Items',
								value: 'aggregateItems',
							},
							{
								name: 'Current Item',
								value: 'currentItem',
							},
						]
					},
					{
						displayName: 'Block	—	Title',
						name: 'blockTitle',
						type: 'string',
						default: '',
						description: 'Optional title displayed above the block',
					},
					{
						displayName: 'Block Type',
						name: 'blockTemplateType',
						type: 'options',
						default: 'table',
						options: [
							{
								name: 'Table',
								value: 'table',
							},
							{
								name: 'List',
								value: 'list',
							},
							{
								name: 'Chart',
								value: 'chart',
							},
							{
								name: 'Text',
								value: 'text',
							},
					]
					},
					{
						displayName: 'Chart	—	Canvas Height',
						name: 'blockChartHeight',
						type: 'number',
						default: 220
					},
					{
						displayName: 'Chart	—	Label Field',
						name: 'blockChartLabelField',
						type: 'string',
						default: '',
						description: 'Used when Labels Mode is field',
					},
					{
						displayName: 'Chart	—	Labels Array (JSON)',
						name: 'blockChartLabelsArray',
						type: 'string',
						default: '[]',
						placeholder: '[\'Jan\',\'Feb\']',
						description: 'Used when Labels Mode is array',
					},
					{
						displayName: 'Chart	—	Labels Mode',
						name: 'blockChartLabelsMode',
						type: 'options',
						default: 'field',
						options: [
							{
								name: 'From Field',
								value: 'field',
							},
							{
								name: 'From Array',
								value: 'array',
							},
					]
					},
					{
						displayName: 'Chart	—	Legend Position',
						name: 'blockChartLegendPosition',
						type: 'options',
						default: 'top',
						options: [
							{
								name: 'Top',
								value: 'top',
							},
							{
								name: 'Bottom',
								value: 'bottom',
							},
					]
					},
					{
						displayName: 'Chart	—	Value Field',
						name: 'blockChartValueField',
						type: 'string',
						default: '',
						description: 'Used when Values Mode is field',
					},
					{
						displayName: 'Chart	—	Values Array (JSON)',
						name: 'blockChartValuesArray',
						type: 'string',
						default: '[]',
						placeholder: '[120,95]',
						description: 'Used when Values Mode is array',
					},
					{
						displayName: 'Chart	—	Values Mode',
						name: 'blockChartValuesMode',
						type: 'options',
						default: 'field',
						options: [
							{
								name: 'From Field',
								value: 'field',
							},
							{
								name: 'From Array',
								value: 'array',
							},
					]
					},
					{
						displayName: 'Chart Type (for Chart Blocks)',
						name: 'blockChartType',
						type: 'options',
						default: 'bar',
						options: [
							{
								name: 'Bar',
								value: 'bar',
							},
							{
								name: 'Donut',
								value: 'donut',
							},
							{
								name: 'Line',
								value: 'line',
							},
							{
								name: 'Pie',
								value: 'pie',
							},
							{
								name: 'Polar',
								value: 'polar',
							},
					]
					},
					{
						displayName: 'List	—	Primary Field',
						name: 'blockListPrimaryField',
						type: 'string',
						default: '',
						description: 'Used when Block Type is List. Primary line per item.',
					},
					{
						displayName: 'List	—	Primary Label',
						name: 'blockListPrimaryLabel',
						type: 'string',
						default: '',
						description: 'Optional label displayed above the primary value',
					},
					{
						displayName: 'List	—	Secondary as Badge',
						name: 'blockListSecondaryAsBadge',
						type: 'boolean',
						default: true,
					},
					{
						displayName: 'List	—	Secondary Field',
						name: 'blockListSecondaryField',
						type: 'string',
						default: '',
						description: 'Used when Block Type is List. Secondary line per item.',
					},
					{
						displayName: 'List	—	Secondary Label',
						name: 'blockListSecondaryLabel',
						type: 'string',
						default: '',
						description: 'Optional label for the secondary value',
					},
					{
						displayName: 'Table Columns (Field|Header, Comma-Separated)',
						name: 'blockTableColumns',
						type: 'string',
						default: '',
						placeholder: '{{	$json.name	}}|Name,	{{	$json.status	}}|Status',
						description: 'Used when Block Type is Table. Each entry:	fieldPath|optionalHeader.',
					},
					{
						displayName: 'Text	—	Paragraph (Supports Placeholders)',
						name: 'blockTextParagraph',
						type: 'string',
						default: '',
						placeholder: 'e.g. This is a summary for	{{item.company}}.',
						description: 'Paragraph content rendered inside the card (same escaping rules as allowUnsafeHtml)',
					},
			],
			},
		],
	},
	{
		displayName: 'Page & Sections Options',
		name: 'pageSectionsUi',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		description: 'Configure page title/subtitle + section toggles',
		displayOptions: { show: { uxConfigMode: ['pro'] } },
		options: [
			{
				displayName: 'Page — Logo URL',
				name: 'logoUrl',
				type: 'string',
				default: '',
				description: 'Optional https image URL shown in the header',
			},
			{
				displayName: 'Page — Meta Description',
				name: 'metaDescription',
				type: 'string',
				default: '',
				description: 'HTML meta description for the rendered page',
			},
			{
				displayName: 'Page — Subtitle',
				name: 'subtitle',
				type: 'string',
				default: '',
				description: 'Supports placeholders like {{stats.count}}',
			},
			{
				displayName: 'Page — Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Supports placeholders like {{meta.generatedAt}}',
			},
			{
				displayName: 'Sections — Footer Text',
				name: 'footerText',
				type: 'string',
				default: '',
				description: 'Footer line. Empty uses the preset footer text.',
			},
			{
				displayName: 'Sections — Show Footer',
				name: 'showFooter',
				type: 'boolean',
				default: true,
				description: 'Whether to render the footer section',
			},
			{
				displayName: 'Sections — Show Header',
				name: 'showHeader',
				type: 'boolean',
				default: true,
				description: 'Whether to render the title and subtitle block',
			},
			{
				displayName: 'Sections — Show KPI Section',
				name: 'showKpiSection',
				type: 'boolean',
				default: true,
				description: 'Whether to render the KPI summary cards',
			},
		],
	},
	{
		displayName: 'Chat Widget (Direct Webhook)',
		name: 'chatWidgetUi',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		description: 'Optional chat launcher icon that opens an embedded chat widget powered by your public n8n webhook',
		displayOptions: { show: { uxConfigMode: ['pro'] } },
		options: [
			{
				displayName: 'Chat Widget Height (Px)',
				name: 'height',
				type: 'number',
				default: 680,
				typeOptions: { minValue: 200, maxValue: 1200 },
				description: 'Widget panel height in pixels',
			},
			{
				displayName: 'Enable Chat Widget',
				name: 'enabled',
				type: 'boolean',
				default: false,
				description:
					'Whether to show a chat icon on the page and open the webhook-powered widget when clicked',
			},
			{
				displayName: 'Launcher Aria Label',
				name: 'launcherAriaLabel',
				type: 'string',
				default: 'Open chat',
				description: 'Accessibility label for the chat icon button',
			},
			{
				displayName: 'Launcher Title',
				name: 'launcherTitle',
				type: 'string',
				default: 'Chat',
				description: 'Title displayed in the chat widget header',
			},
			{
				displayName: 'Public Chat Webhook URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'Public https/http URL of your n8n chat webhook endpoint (must be http/https)',
			},
		],
	},
	{
		displayName: 'Style Options',
		name: 'styleUi',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		description: 'Configure colors, radius, shadow and typography',
		displayOptions: { show: { uxConfigMode: ['pro'] } },
		options: [
			{
				displayName: 'Style — Accent Color',
				name: 'accentColor',
				type: 'color',
				default: '',
				description: 'Leave empty to use the preset accent color',
			},
			{
				displayName: 'Style — Background Color',
				name: 'backgroundColor',
				type: 'color',
				default: '',
				description: 'Leave empty to use the preset page background',
			},
			{
				displayName: 'Style — Card Background Color',
				name: 'cardBackgroundColor',
				type: 'color',
				default: '',
				description: 'Leave empty for default light or dark card fill',
			},
			{
				displayName: 'Style — Card Radius',
				name: 'cardRadius',
				type: 'number',
				default: 12,
				typeOptions: { minValue: 0, maxValue: 28 },
				description: 'Corner radius for cards in pixels',
			},
			{
				displayName: 'Style — Enable Shadow',
				name: 'enableShadow',
				type: 'boolean',
				default: true,
				description: 'Whether cards use a drop shadow',
			},
			{
				displayName: 'Style — Font Family',
				name: 'fontFamily',
				type: 'string',
				default: '',
				description: 'CSS font-family stack for the page',
			},
			{
				displayName: 'Style — Text Color',
				name: 'textColor',
				type: 'color',
				default: '',
				description: 'Leave empty to use the preset text color',
			},
		],
	},
	{
		displayName: 'Advanced Options',
		name: 'advancedUi',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		description: 'Security and advanced rendering options',
		displayOptions: { show: { uxConfigMode: ['pro'] } },
		options: [
			{
				displayName: 'Advanced — Allow Unsafe HTML',
				name: 'allowUnsafeHtml',
				type: 'boolean',
				default: false,
				description: 'Whether placeholders are injected without escaping',
			},
			{
				displayName: 'Advanced — Custom CSS',
				name: 'customCss',
				type: 'string',
				default: '',
				typeOptions: { rows: 8 },
				description: 'Extra CSS appended to the page style block',
			},
			{
				displayName: 'Advanced — Include Meta in Output',
				name: 'includeMeta',
				type: 'boolean',
				default: true,
				description: 'Whether to add a meta object with render timing and warnings on the output item',
			},
		],
	},
	{
		displayName: 'Page — Title',
		name: 'pageTitle',
		type: 'string',
		default: '',
		description: 'Supports placeholders like {{meta.generatedAt}}. Empty uses the preset title.',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Page — Subtitle',
		name: 'pageSubtitle',
		type: 'string',
		default: '',
		description: 'Supports placeholders like {{stats.count}}',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Page — Meta Description',
		name: 'pageMetaDescription',
		type: 'string',
		default: 'Generated HTML report',
		description: 'HTML meta description for the rendered page',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Page — Logo URL',
		name: 'pageLogoUrl',
		type: 'string',
		default: '',
		description: 'Optional https image URL shown in the header',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Sections — Footer Text',
		name: 'sectionFooterText',
		type: 'string',
		default: '',
		description: 'Footer line. Empty uses the preset footer text.',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Sections — Show Footer',
		name: 'sectionShowFooter',
		type: 'boolean',
		default: true,
		description: 'Whether to render the footer section',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Sections — Show Header',
		name: 'sectionShowHeader',
		type: 'boolean',
		default: true,
		description: 'Whether to render the title and subtitle block',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Sections — Show KPI Section',
		name: 'sectionShowKpiSection',
		type: 'boolean',
		default: true,
		description: 'Whether to render the KPI summary cards',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Data — Limit Items',
		name: 'dataLimitItems',
		type: 'number',
		default: 100,
		description: 'Max items to include when aggregating input',
		typeOptions: { minValue: 1 },
	},
	{
		displayName: 'Data — Missing Field Fallback',
		name: 'dataMissingFieldFallback',
		type: 'string',
		default: '-',
		description: 'Shown when a mapped field is missing on an item',
	},
	{
		displayName: 'Table Columns',
		name: 'tableColumnsUi',
		type: 'fixedCollection',
		placeholder: 'Add Column',
		default: {},
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		description: 'Pick the fields to render (in order). Optionally set a header alias.',
		displayOptions: { show: { templateType: ['table'], pageCompositionMode: ['single'] } },
		options: [
			{
				name: 'tableColumnsValues',
				displayName: 'Columns',
				values: [
					{
						displayName: 'Field',
						name: 'field',
						type: 'string',
						default: '',
						placeholder: 'name or {{ $json.name }}',
						description: 'Field path / expression used to read values from each item',
					},
					{
						displayName: 'Header',
						name: 'header',
						type: 'string',
						default: '',
						placeholder: 'e.g. Customer',
						description: 'Optional column header alias. Empty = uses the resolved field key.',
					},
				],
			},
		],
	},
	{
		displayName: 'Table Options',
		name: 'tableOptionsUi',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: { templateType: ['table'], pageCompositionMode: ['single'] } },
		options: [
			{
				displayName: 'Density',
				name: 'density',
				type: 'options',
				default: 'comfortable',
				options: [
					{ name: 'Compact', value: 'compact' },
					{ name: 'Comfortable', value: 'comfortable' },
				],
			},
			{
				displayName: 'Zebra Rows',
				name: 'zebraRows',
				type: 'boolean',
				default: true,
			},
		],
	},
	{
		displayName: 'List Card Lines',
		name: 'listLinesUi',
		type: 'fixedCollection',
		placeholder: 'Add line',
		default: {},
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		description: 'Ordered lines (primary then secondary)',
		displayOptions: { show: { templateType: ['list'], uxConfigMode: ['pro'], pageCompositionMode: ['single'] } },
		options: [
			{
				name: 'listLinesValues',
				displayName: 'Lines',
				values: [
					{
						displayName: 'Field',
						name: 'field',
						type: 'string',
						default: '',
						placeholder: 'name or {{ $json.name }}',
						description: 'Field path / expression used to read values from each item',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						placeholder: 'Optional label',
						description: 'Optional label displayed for this line',
					},
				],
			},
		],
	},
	{
		displayName: 'List — Primary Field',
		name: 'listPrimaryField',
		type: 'string',
		default: '',
		description: 'Main line per item. Empty uses the first object key.',
		displayOptions: { show: { templateType: ['list'], uxConfigMode: ['legacy'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'List — Primary Label',
		name: 'listPrimaryLabel',
		type: 'string',
		default: '',
		description: 'Optional label displayed above the primary value',
		displayOptions: { show: { templateType: ['list'], uxConfigMode: ['legacy'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'List — Secondary Field',
		name: 'listSecondaryField',
		type: 'string',
		default: '',
		description: 'Optional secondary line. Empty uses the second object key if present.',
		displayOptions: { show: { templateType: ['list'], uxConfigMode: ['legacy'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'List — Secondary Label',
		name: 'listSecondaryLabel',
		type: 'string',
		default: '',
		description: 'Optional label for the secondary value',
		displayOptions: { show: { templateType: ['list'], uxConfigMode: ['legacy'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'List Options',
		name: 'listOptionsUi',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: { templateType: ['list'], pageCompositionMode: ['single'] } },
		options: [
			{
				displayName: 'Secondary as Badge',
				name: 'secondaryAsBadge',
				type: 'boolean',
				default: true,
			},
		],
	},
	{
		displayName: 'Chart — Labels Mode',
		name: 'chartLabelsMode',
		type: 'options',
		default: 'field',
		description: 'How to build X-axis labels',
		options: [
			{ name: 'From Field', value: 'field' },
			{ name: 'From Array', value: 'array' },
		],
		displayOptions: { show: { templateType: ['chart'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chart — Label Field',
		name: 'chartLabelField',
		type: 'string',
		default: '',
		description: 'Field path for labels (e.g. month)',
		displayOptions: {
			show: { templateType: ['chart'], chartLabelsMode: ['field'], pageCompositionMode: ['single'] },
		},
	},
	{
		displayName: 'Chart — Labels Array (JSON)',
		name: 'chartLabelsArray',
		type: 'string',
		default: '[]',
		placeholder: '["Jan","Feb"]',
		description: 'JSON array of labels',
		displayOptions: {
			show: {
				templateType: ['chart'],
				chartLabelsMode: ['array'],
				uxConfigMode: ['legacy'],
				pageCompositionMode: ['single'],
			},
		},
	},
	{
		displayName: 'Chart — Labels (Ordered UI)',
		name: 'chartLabelsArrayUi',
		type: 'fixedCollection',
		placeholder: 'Add label',
		default: {},
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		description: 'Ordered labels for the X axis',
		displayOptions: {
			show: {
				templateType: ['chart'],
				chartLabelsMode: ['array'],
				uxConfigMode: ['pro'],
				pageCompositionMode: ['single'],
			},
		},
		options: [
			{
				name: 'chartLabelsArrayUiValues',
				displayName: 'Labels',
				values: [
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						placeholder: 'e.g. Jan',
						description: 'Label text',
					},
				],
			},
		],
	},
	{
		displayName: 'Chart — Values Mode',
		name: 'chartValuesMode',
		type: 'options',
		default: 'field',
		description: 'How to build Y-axis values',
		options: [
			{ name: 'From Field', value: 'field' },
			{ name: 'From Array', value: 'array' },
		],
		displayOptions: { show: { templateType: ['chart'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chart — Value Field',
		name: 'chartValueField',
		type: 'string',
		default: '',
		description: 'Field path for numeric values (e.g. sales)',
		displayOptions: { show: { templateType: ['chart'], chartValuesMode: ['field'], pageCompositionMode: ['single'] } },
	},
	{
		displayName: 'Chart — Values Array (JSON)',
		name: 'chartValuesArray',
		type: 'string',
		default: '[]',
		placeholder: '[120,95]',
		description: 'JSON array of numeric values',
		displayOptions: {
			show: {
				templateType: ['chart'],
				chartValuesMode: ['array'],
				uxConfigMode: ['legacy'],
				pageCompositionMode: ['single'],
			},
		},
	},
	{
		displayName: 'Chart — Values (Ordered UI)',
		name: 'chartValuesArrayUi',
		type: 'fixedCollection',
		placeholder: 'Add value',
		default: {},
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		description: 'Ordered numeric values for the Y axis',
		displayOptions: {
			show: {
				templateType: ['chart'],
				chartValuesMode: ['array'],
				uxConfigMode: ['pro'],
				pageCompositionMode: ['single'],
			},
		},
		options: [
			{
				name: 'chartValuesArrayUiValues',
				displayName: 'Values',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'number',
						default: 0,
						description: 'Numeric value',
					},
				],
			},
		],
	},
	{
		displayName: 'Chart Options',
		name: 'chartOptionsUi',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: { templateType: ['chart'], pageCompositionMode: ['single'] } },
		options: [
			{
				displayName: 'Canvas Height',
				name: 'height',
				type: 'number',
				default: 220,
				typeOptions: { minValue: 100, maxValue: 800 },
			},
			{
				displayName: 'Legend Position',
				name: 'legendPosition',
				type: 'options',
				default: 'top',
				options: [
					{ name: 'Top', value: 'top' },
					{ name: 'Bottom', value: 'bottom' },
				],
			},
		],
	},
	{
		displayName: 'Style — Accent Color',
		name: 'styleAccentColor',
		type: 'color',
		default: '',
		description: 'Leave empty to use the preset accent color',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Style — Background Color',
		name: 'styleBackgroundColor',
		type: 'color',
		default: '',
		description: 'Leave empty to use the preset page background',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Style — Card Background Color',
		name: 'styleCardBackgroundColor',
		type: 'color',
		default: '',
		description: 'Leave empty for default light or dark card fill',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Style — Card Radius',
		name: 'styleCardRadius',
		type: 'number',
		default: 12,
		typeOptions: { minValue: 0, maxValue: 28 },
		description: 'Corner radius for cards in pixels',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Style — Enable Shadow',
		name: 'styleEnableShadow',
		type: 'boolean',
		default: true,
		description: 'Whether cards use a drop shadow',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Style — Font Family',
		name: 'styleFontFamily',
		type: 'string',
		default: 'Inter, Segoe UI, Roboto, sans-serif',
		description: 'CSS font-family stack for the page',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Style — Text Color',
		name: 'styleTextColor',
		type: 'color',
		default: '',
		description: 'Leave empty to use the preset text color',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Advanced — Allow Unsafe HTML',
		name: 'advancedAllowUnsafeHtml',
		type: 'boolean',
		default: false,
		description: 'Whether placeholders are injected without escaping',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Advanced — Custom CSS',
		name: 'advancedCustomCss',
		type: 'string',
		default: '',
		typeOptions: { rows: 8 },
		description: 'Extra CSS appended to the page style block',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
	{
		displayName: 'Advanced — Include Meta in Output',
		name: 'advancedIncludeMeta',
		type: 'boolean',
		default: true,
		description: 'Whether to add a meta object with render timing and warnings on the output item',
		displayOptions: { show: { uxConfigMode: ['legacy'] } },
	},
];

export class UiRenderer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'UI Render',
		name: 'uiRenderer',
		icon: { light: 'file:ui-renderer.svg', dark: 'file:ui-renderer.dark.svg' },
		group: ['transform'],
		version: 7,
		description: 'Render professional HTML pages from input items',
		defaults: { name: 'UI Render' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: BASE_PROPERTIES,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const items = inputItems.length > 0 ? inputItems : [{ json: {} }];
		const firstIndex = 0;

		try {
			const templateType = this.getNodeParameter('templateType', firstIndex, 'table') as string;
			const inputMode = this.getNodeParameter('inputMode', firstIndex, 'aggregateItems') as string;
			const presetName = this.getNodeParameter('preset', firstIndex, 'ExecutiveDashboard') as string;
			const chartType = this.getNodeParameter('chartType', firstIndex, 'bar') as string;
			const theme = this.getNodeParameter('theme', firstIndex, 'light') as string;
			const layoutDensity = this.getNodeParameter('layoutDensity', firstIndex, 'comfortable') as string;
			const uxConfigMode = this.getNodeParameter('uxConfigMode', firstIndex, 'pro') as string;

			const pageSectionsUi = this.getNodeParameter('pageSectionsUi', firstIndex, {}) as JsonObject;
			const proTitle = asString((pageSectionsUi as JsonObject).title, '');
			const proSubtitle = asString((pageSectionsUi as JsonObject).subtitle, '');
			const proMetaDescription = asString((pageSectionsUi as JsonObject).metaDescription, '');
			const proLogoUrl = asString((pageSectionsUi as JsonObject).logoUrl, '');
			const proFooterText = asString((pageSectionsUi as JsonObject).footerText, '');

			const legacyTitle = this.getNodeParameter('pageTitle', firstIndex, '') as string;
			const legacySubtitle = this.getNodeParameter('pageSubtitle', firstIndex, '') as string;
			const legacyMetaDescription = this.getNodeParameter(
				'pageMetaDescription',
				firstIndex,
				'Generated HTML report',
			) as string;
			const legacyLogoUrl = this.getNodeParameter('pageLogoUrl', firstIndex, '') as string;
			const legacyFooterText = this.getNodeParameter('sectionFooterText', firstIndex, '') as string;
			const legacyShowFooter = this.getNodeParameter('sectionShowFooter', firstIndex, true);
			const legacyShowHeader = this.getNodeParameter('sectionShowHeader', firstIndex, true);
			const legacyShowKpiSection = this.getNodeParameter('sectionShowKpiSection', firstIndex, true);

			const pageConfig: JsonObject = {
				title: uxConfigMode === 'pro' && proTitle !== '' ? proTitle : legacyTitle,
				subtitle: uxConfigMode === 'pro' && proSubtitle !== '' ? proSubtitle : legacySubtitle,
				metaDescription:
					uxConfigMode === 'pro' && proMetaDescription !== '' ? proMetaDescription : legacyMetaDescription,
				logoUrl: uxConfigMode === 'pro' && proLogoUrl !== '' ? proLogoUrl : legacyLogoUrl,
			};
			const sectionConfig: JsonObject = {
				showHeader:
					uxConfigMode === 'pro' && (pageSectionsUi as JsonObject).showHeader === false
						? false
						: legacyShowHeader,
				showKpiSection:
					uxConfigMode === 'pro' && (pageSectionsUi as JsonObject).showKpiSection === false
						? false
						: legacyShowKpiSection,
				showFooter:
					uxConfigMode === 'pro' && (pageSectionsUi as JsonObject).showFooter === false ? false : legacyShowFooter,
				footerText: uxConfigMode === 'pro' && proFooterText !== '' ? proFooterText : legacyFooterText,
			};

			const chatWidgetUi = this.getNodeParameter('chatWidgetUi', firstIndex, {}) as JsonObject;
			const rawChatWidgetEnabled = Boolean((chatWidgetUi as JsonObject).enabled ?? false);
			const rawChatWidgetUrl = asString((chatWidgetUi as JsonObject).url, '');
			const resolvedChatWidgetHeight = clampNumber(Number((chatWidgetUi as JsonObject).height ?? 680), 200, 1200);
			const resolvedChatWidgetLauncherAriaLabel = asString((chatWidgetUi as JsonObject).launcherAriaLabel, 'Open chat');
			const resolvedChatWidgetLauncherTitle = asString((chatWidgetUi as JsonObject).launcherTitle, 'Chat');
			const chatWidgetConfig: IChatWidgetConfig = {
				enabled: rawChatWidgetEnabled,
				url: rawChatWidgetUrl,
				height: resolvedChatWidgetHeight,
				launcherAriaLabel: resolvedChatWidgetLauncherAriaLabel,
				launcherTitle: resolvedChatWidgetLauncherTitle,
				allowedOrigin: '',
			};

			const tableColumnsValues = this.getNodeParameter('tableColumnsUi.tableColumnsValues', firstIndex, []) as JsonObject[];
			const tableColumns = Array.isArray(tableColumnsValues)
				? tableColumnsValues
						.map((col) => ({
							field: asString((col as JsonObject).field, ''),
							header: asString((col as JsonObject).header, ''),
						}))
						.filter((col) => col.field !== '')
				: [];

			const listOptionsUi = this.getNodeParameter('listOptionsUi', firstIndex, {}) as JsonObject;
			const chartOptionsUi = this.getNodeParameter('chartOptionsUi', firstIndex, {}) as JsonObject;

			const chartLabelsMode = this.getNodeParameter('chartLabelsMode', firstIndex, 'field') as string;
			const chartValuesMode = this.getNodeParameter('chartValuesMode', firstIndex, 'field') as string;

			const columnFieldsLegacy = tableColumns.map((c) => c.field).join(',');

			const legacyListPrimaryField = this.getNodeParameter('listPrimaryField', firstIndex, '') as string;
			const legacyListSecondaryField = this.getNodeParameter('listSecondaryField', firstIndex, '') as string;
			const legacyListPrimaryLabel = this.getNodeParameter('listPrimaryLabel', firstIndex, '') as string;
			const legacyListSecondaryLabel = this.getNodeParameter('listSecondaryLabel', firstIndex, '') as string;

			let listLines: Array<{ field: string; label: string }> = [];
			try {
				const listLinesValues = this.getNodeParameter(
					'listLinesUi.listLinesValues',
					firstIndex,
					[],
				) as JsonObject[];
				listLines = Array.isArray(listLinesValues)
					? listLinesValues
							.map((line) => ({
								field: asString((line as JsonObject | undefined)?.field, ''),
								label: asString((line as JsonObject | undefined)?.label, ''),
							}))
							.filter((line) => line.field !== '')
					: [];
			} catch {
				// If n8n returns an unexpected shape for the fixedCollection,
				// fall back to automatic dataset key inference inside the renderer.
				listLines = [];
			}

			const listPrimaryField = uxConfigMode === 'pro' && listLines[0]?.field ? listLines[0].field : legacyListPrimaryField;
			const listSecondaryField =
				uxConfigMode === 'pro' && listLines[1]?.field ? listLines[1].field : legacyListSecondaryField;
			// IMPORTANT: `undefined !== ''` is true, so we must guard existence before reading `.label`.
			const listPrimaryLabel =
				uxConfigMode === 'pro' && listLines[0]?.label ? listLines[0].label : legacyListPrimaryLabel;
			const listSecondaryLabel =
				uxConfigMode === 'pro' && listLines[1]?.label ? listLines[1].label : legacyListSecondaryLabel;

			const chartLabelsArrayLegacy = this.getNodeParameter(
				'chartLabelsArray',
				firstIndex,
				'[]',
			) as string;
			const chartValuesArrayLegacy = this.getNodeParameter(
				'chartValuesArray',
				firstIndex,
				'[]',
			) as string;

			// Avoid reading chart UI fixedCollection params when template isn't chart:
			// this prevents regressions if n8n doesn't fully provide hidden fields.
			let chartLabelsUi: string[] = [];
			let chartValuesUi: number[] = [];
			try {
				const chartLabelsArrayUiValues: JsonObject[] =
					uxConfigMode === 'pro' && templateType === 'chart' && chartLabelsMode === 'array'
						? (this.getNodeParameter(
								'chartLabelsArrayUi.chartLabelsArrayUiValues',
								firstIndex,
								[],
							) as JsonObject[])
						: [];
				const chartValuesArrayUiValues: JsonObject[] =
					uxConfigMode === 'pro' && templateType === 'chart' && chartValuesMode === 'array'
						? (this.getNodeParameter(
								'chartValuesArrayUi.chartValuesArrayUiValues',
								firstIndex,
								[],
							) as JsonObject[])
						: [];

				chartLabelsUi = chartLabelsArrayUiValues
					.map((v) => asString((v as JsonObject | undefined)?.label, ''))
					.filter((v) => v !== '');

				chartValuesUi = chartValuesArrayUiValues
					.map((v) => Number((v as JsonObject | undefined)?.value))
					.filter((n) => Number.isFinite(n));
			} catch {
				chartLabelsUi = [];
				chartValuesUi = [];
			}

			const chartLabelsArray =
				uxConfigMode === 'pro' && chartLabelsMode === 'array' && chartLabelsUi.length > 0
					? JSON.stringify(chartLabelsUi)
					: chartLabelsArrayLegacy;
			const chartValuesArray =
				uxConfigMode === 'pro' && chartValuesMode === 'array' && chartValuesUi.length > 0
					? JSON.stringify(chartValuesUi)
					: chartValuesArrayLegacy;

			const styleUi = this.getNodeParameter('styleUi', firstIndex, {}) as JsonObject;
			const advancedUi = this.getNodeParameter('advancedUi', firstIndex, {}) as JsonObject;

			const legacyAccentColor = this.getNodeParameter('styleAccentColor', firstIndex, '') as string;
			const legacyBackgroundColor = this.getNodeParameter('styleBackgroundColor', firstIndex, '') as string;
			const legacyCardBackgroundColor = this.getNodeParameter('styleCardBackgroundColor', firstIndex, '') as string;
			const legacyCardRadius = this.getNodeParameter('styleCardRadius', firstIndex, 12);
			const legacyEnableShadow = this.getNodeParameter('styleEnableShadow', firstIndex, true);
			const legacyFontFamily = this.getNodeParameter(
				'styleFontFamily',
				firstIndex,
				'Inter, Segoe UI, Roboto, sans-serif',
			) as string;
			const legacyTextColor = this.getNodeParameter('styleTextColor', firstIndex, '') as string;

			const styleConfig: JsonObject = {
				accentColor: uxConfigMode === 'pro' && asString((styleUi as JsonObject).accentColor, '') !== '' ? asString((styleUi as JsonObject).accentColor, '') : legacyAccentColor,
				backgroundColor:
					uxConfigMode === 'pro' && asString((styleUi as JsonObject).backgroundColor, '') !== ''
						? asString((styleUi as JsonObject).backgroundColor, '')
						: legacyBackgroundColor,
				cardBackgroundColor:
					uxConfigMode === 'pro' && asString((styleUi as JsonObject).cardBackgroundColor, '') !== ''
						? asString((styleUi as JsonObject).cardBackgroundColor, '')
						: legacyCardBackgroundColor,
				cardRadius:
					(() => {
						const proCardRadius = Number((styleUi as JsonObject).cardRadius);
						if (uxConfigMode !== 'pro') return legacyCardRadius;
						return Number.isFinite(proCardRadius) && proCardRadius !== 12 ? proCardRadius : legacyCardRadius;
					})(),
				enableShadow:
					uxConfigMode === 'pro' && (styleUi as JsonObject).enableShadow === false ? false : legacyEnableShadow,
				fontFamily:
					uxConfigMode === 'pro' && asString((styleUi as JsonObject).fontFamily, '') !== ''
						? asString((styleUi as JsonObject).fontFamily, '')
						: legacyFontFamily,
				textColor: uxConfigMode === 'pro' && asString((styleUi as JsonObject).textColor, '') !== '' ? asString((styleUi as JsonObject).textColor, '') : legacyTextColor,
			};

			const legacyAllowUnsafeHtml = this.getNodeParameter('advancedAllowUnsafeHtml', firstIndex, false);
			const legacyCustomCss = this.getNodeParameter('advancedCustomCss', firstIndex, '') as string;
			const legacyIncludeMeta = this.getNodeParameter('advancedIncludeMeta', firstIndex, true);

			const advancedConfig: JsonObject = {
				allowUnsafeHtml:
					uxConfigMode === 'pro' && (advancedUi as JsonObject).allowUnsafeHtml === true
						? true
						: legacyAllowUnsafeHtml,
				customCss: uxConfigMode === 'pro' && asString((advancedUi as JsonObject).customCss, '') !== '' ? asString((advancedUi as JsonObject).customCss, '') : legacyCustomCss,
				includeMeta:
					uxConfigMode === 'pro' && (advancedUi as JsonObject).includeMeta === false ? false : legacyIncludeMeta,
			};

			const dataMappingConfig: JsonObject = {
				limitItems: this.getNodeParameter('dataLimitItems', firstIndex, 100),
				missingFieldFallback: this.getNodeParameter('dataMissingFieldFallback', firstIndex, '-') as string,
				// Legacy keys
				columnFields: columnFieldsLegacy,
				listPrimaryField,
				listSecondaryField,
				chartLabelField: this.getNodeParameter('chartLabelField', firstIndex, '') as string,
				chartValueField: this.getNodeParameter('chartValueField', firstIndex, '') as string,

				// Renderers
				tableColumnsUi: tableColumns,
				listPrimaryLabel,
				listSecondaryLabel,
				listSecondaryAsBadge: Boolean((listOptionsUi as JsonObject).secondaryAsBadge ?? true),

				chartLabelsMode,
				chartValuesMode,
				chartLabelsArray,
				chartValuesArray,
				chartHeight: Number((chartOptionsUi as JsonObject).height ?? 220),
				chartLegendPosition: (chartOptionsUi as JsonObject).legendPosition ?? 'top',

				// Section Text
				sectionTextTitle: this.getNodeParameter('sectionTextTitle', firstIndex, '') as string,
				sectionTextParagraph: this.getNodeParameter('sectionTextParagraph', firstIndex, '') as string,

				// Chat
				chatMessagesField: this.getNodeParameter('chatMessagesField', firstIndex, 'messages') as string,
				chatRoleField: this.getNodeParameter('chatRoleField', firstIndex, 'role') as string,
				chatContentField: this.getNodeParameter('chatContentField', firstIndex, 'content') as string,
				chatTimestampField: this.getNodeParameter('chatTimestampField', firstIndex, 'timestamp') as string,
				chatUserRole: this.getNodeParameter('chatUserRole', firstIndex, 'user') as string,
				chatAssistantRole: this.getNodeParameter('chatAssistantRole', firstIndex, 'assistant') as string,
				chatSystemRole: this.getNodeParameter('chatSystemRole', firstIndex, 'system') as string,
			};
			const resolvedPresetName = PRESET_MAP[presetName] ? presetName : 'ExecutiveDashboard';
			const preset = PRESET_MAP[resolvedPresetName] ?? PRESET_MAP.ExecutiveDashboard;
			const pageCompositionMode = this.getNodeParameter('pageCompositionMode', firstIndex, 'single') as string;
			const itemLimit = Math.max(1, Number(dataMappingConfig.limitItems ?? 100));
			const renderStartedAt = Date.now();

			let blocksConfig: IRenderBlockConfig[] = [];
			if (pageCompositionMode === 'multi') {
				const blocksValues = this.getNodeParameter('blocksUi.blocksValues', firstIndex, []) as JsonObject[];
				const missingFieldFallback = dataMappingConfig.missingFieldFallback as string;

				const parseTableColumns = (raw: string): JsonObject[] => {
					const entries = raw
						.split(/[,;\n]/g)
						.map((v) => v.trim())
						.filter(Boolean);
					return entries
						.map((entry) => {
							const [field, header] = entry.split('|').map((v) => v.trim());
							const resolvedField = asString(field, '');
							if (!resolvedField) return null;
							return { field: resolvedField, header: asString(header, '') };
						})
						.filter((v) => v !== null) as JsonObject[];
				};

				blocksConfig = Array.isArray(blocksValues)
					? blocksValues
							.map((b) => {
								const templateType = asString((b as JsonObject).blockTemplateType, 'table') as
									| 'table'
									| 'list'
									| 'chart'
									| 'text';
								const inputMode = asString((b as JsonObject).blockInputMode, 'aggregateItems') as 'aggregateItems' | 'currentItem';
								const title = asString((b as JsonObject).blockTitle, '');
								const chartTypeBlock = asString((b as JsonObject).blockChartType, 'bar');

								if (templateType === 'table') {
									const cols = parseTableColumns(asString((b as JsonObject).blockTableColumns, ''));
									return {
										templateType,
										inputMode,
										title,
										chartType: chartTypeBlock,
										dataMappingConfig: {
											missingFieldFallback,
											tableColumnsUi: cols,
										},
									} satisfies IRenderBlockConfig;
								}

								if (templateType === 'list') {
									return {
										templateType,
										inputMode,
										title,
										chartType: chartTypeBlock,
										dataMappingConfig: {
											missingFieldFallback,
											listPrimaryField: asString((b as JsonObject).blockListPrimaryField, ''),
											listPrimaryLabel: asString((b as JsonObject).blockListPrimaryLabel, ''),
											listSecondaryField: asString((b as JsonObject).blockListSecondaryField, ''),
											listSecondaryLabel: asString((b as JsonObject).blockListSecondaryLabel, ''),
											listSecondaryAsBadge: Boolean((b as JsonObject).blockListSecondaryAsBadge ?? true),
										},
									} satisfies IRenderBlockConfig;
								}

								if (templateType === 'text') {
									return {
										templateType,
										inputMode,
										title,
										chartType: chartTypeBlock,
										dataMappingConfig: {
											textParagraph: asString((b as JsonObject).blockTextParagraph, ''),
										},
									} satisfies IRenderBlockConfig;
								}

								const chartLabelsMode = asString((b as JsonObject).blockChartLabelsMode, 'field');
								const chartValuesMode = asString((b as JsonObject).blockChartValuesMode, 'field');
								return {
									templateType: 'chart',
									inputMode,
									title,
									chartType: asString((b as JsonObject).blockChartType, 'bar'),
									dataMappingConfig: {
										missingFieldFallback,
										chartLabelsMode,
										chartValuesMode,
										chartLabelField: asString((b as JsonObject).blockChartLabelField, ''),
										chartValueField: asString((b as JsonObject).blockChartValueField, ''),
										chartLabelsArray: asString((b as JsonObject).blockChartLabelsArray, '[]'),
										chartValuesArray: asString((b as JsonObject).blockChartValuesArray, '[]'),
										chartHeight: Number((b as JsonObject).blockChartHeight ?? 220),
										chartLegendPosition: asString((b as JsonObject).blockChartLegendPosition, 'top'),
									},
								} satisfies IRenderBlockConfig;
							})
							.filter(Boolean) as IRenderBlockConfig[]
					: [];
			}

			const allItemsForBlocks = items.slice(0, itemLimit);

			if (inputMode === 'aggregateItems') {
				const context = buildRenderContext({
					items: allItemsForBlocks,
					allItems: allItemsForBlocks,
					compositionMode: pageCompositionMode === 'multi' ? 'multi' : 'single',
					blocks: pageCompositionMode === 'multi' ? blocksConfig : undefined,
					templateType,
					chartType,
					theme,
					layoutDensity,
					preset,
					presetName: resolvedPresetName,
					pageConfig,
					sectionConfig,
					dataMappingConfig,
					styleConfig,
					advancedConfig,
					chatWidgetConfig,
				});

				const outputItem: INodeExecutionData = {
					json: {
						html: buildHtmlDocument(context),
						contentType: 'text/html; charset=utf-8',
					},
				};

				if (context.includeMeta) {
					outputItem.json.meta = {
						template: templateType,
						itemCount: context.items.length,
						renderMs: Date.now() - renderStartedAt,
						warnings: context.warnings,
					};
				}

				return [[outputItem]];
			}

			const outputItems: INodeExecutionData[] = [];
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				const context = buildRenderContext({
					items: [items[itemIndex]],
					allItems: allItemsForBlocks,
					compositionMode: pageCompositionMode === 'multi' ? 'multi' : 'single',
					blocks: pageCompositionMode === 'multi' ? blocksConfig : undefined,
					templateType,
					chartType,
					theme,
					layoutDensity,
					preset,
					presetName: resolvedPresetName,
					pageConfig,
					sectionConfig,
					dataMappingConfig,
					styleConfig,
					advancedConfig,
					chatWidgetConfig,
				});
				const nextItem: INodeExecutionData = {
					json: {
						...items[itemIndex].json,
						html: buildHtmlDocument(context),
						contentType: 'text/html; charset=utf-8',
					},
					pairedItem: itemIndex,
				};

				if (context.includeMeta) {
					nextItem.json.meta = {
						template: templateType,
						itemCount: 1,
						renderMs: Date.now() - renderStartedAt,
						warnings: context.warnings,
					};
				}

				outputItems.push(nextItem);
			}

			return [outputItems];
		} catch (error) {
			throw new NodeOperationError(this.getNode(), error as Error);
		}
	}
}

interface IRenderContextInput {
	items: INodeExecutionData[];
	templateType: string;
	chartType: string;
	theme: string;
	layoutDensity: string;
	preset: IRenderPreset;
	presetName: string;
	pageConfig: JsonObject;
	sectionConfig: JsonObject;
	dataMappingConfig: JsonObject;
	styleConfig: JsonObject;
	advancedConfig: JsonObject;
	chatWidgetConfig: IChatWidgetConfig;
	allItems?: INodeExecutionData[];
	compositionMode?: 'single' | 'multi';
	blocks?: Array<IRenderBlockConfig>;
}

interface IChatWidgetConfig {
	enabled: boolean;
	url: string;
	height: number;
	launcherAriaLabel: string;
	launcherTitle: string;
	allowedOrigin: string;
}

interface IRenderContext {
	items: JsonObject[];
	allItems: JsonObject[];
	compositionMode: 'single' | 'multi';
	blocks?: Array<IRenderBlockConfig>;
	templateType: string;
	chartType: string;
	presetName: string;
	title: string;
	subtitle: string;
	metaDescription: string;
	logoUrl: string;
	sections: ISectionConfig;
	style: IStyleConfig;
	dataMappingConfig: JsonObject;
	allowUnsafeHtml: boolean;
	customCss: string;
	includeMeta: boolean;
	chatWidget: IChatWidgetConfig;
	warnings: string[];
	placeholderMeta: JsonObject;
	blockTitle?: string;
}

interface IRenderBlockConfig {
	templateType: 'table' | 'list' | 'chart' | 'text';
	inputMode: 'aggregateItems' | 'currentItem';
	title: string;
	chartType: string;
	dataMappingConfig: JsonObject;
}

function buildRenderContext(input: IRenderContextInput): IRenderContext {
	const warnings: string[] = [];
	const normalizedItems = normalizeItems(input.items);
	const allItemsNormalized = input.allItems ? normalizeItems(input.allItems) : normalizedItems;
	const allowUnsafeHtml = Boolean(input.advancedConfig.allowUnsafeHtml ?? false);
	const includeMeta = Boolean(input.advancedConfig.includeMeta ?? true);
	const placeholderMeta: JsonObject = { generatedAt: new Date().toISOString() };
	const placeholderStats: JsonObject = { count: normalizedItems.length };

	const resolvedChatWidgetUrl = sanitizeUrl(asString(input.chatWidgetConfig.url, ''), warnings);
	let resolvedChatWidgetAllowedOrigin = '';
	if (resolvedChatWidgetUrl) {
		try {
			resolvedChatWidgetAllowedOrigin = new URL(resolvedChatWidgetUrl).origin;
		} catch {
			resolvedChatWidgetAllowedOrigin = '';
		}
	}
	const chatWidget: IChatWidgetConfig = {
		...input.chatWidgetConfig,
		enabled: Boolean(input.chatWidgetConfig.enabled) && resolvedChatWidgetUrl !== '',
		url: resolvedChatWidgetUrl,
		allowedOrigin: resolvedChatWidgetAllowedOrigin,
	};
	const style = buildStyleConfig(input.styleConfig, input.preset, {
		theme: input.theme,
		layoutDensity: input.layoutDensity,
	});
	const sections = buildSectionConfig(input.sectionConfig, input.preset);
	const customCss = sanitizeCustomCss((input.advancedConfig.customCss as string) ?? '', warnings);
	const title = resolveTemplateString(
		asString(input.pageConfig.title, input.preset.title),
		normalizedItems[0],
		placeholderMeta,
		placeholderStats,
		allowUnsafeHtml,
	);
	const subtitle = resolveTemplateString(
		asString(input.pageConfig.subtitle, input.preset.subtitle),
		normalizedItems[0],
		placeholderMeta,
		placeholderStats,
		allowUnsafeHtml,
	);
	const logoUrl = sanitizeUrl(asString(input.pageConfig.logoUrl, ''), warnings);

	return {
		items: normalizedItems,
		allItems: allItemsNormalized,
		compositionMode: input.compositionMode ?? 'single',
		blocks: input.blocks,
		templateType: input.templateType,
		chartType: input.chartType,
		presetName: input.presetName,
		title,
		subtitle,
		metaDescription: asString(input.pageConfig.metaDescription, 'Generated HTML report'),
		logoUrl,
		sections,
		style,
		dataMappingConfig: input.dataMappingConfig,
		allowUnsafeHtml,
		customCss,
		includeMeta,
		chatWidget,
		warnings,
		placeholderMeta,
	};
}

function buildStyleConfig(
	styleConfig: JsonObject,
	preset: IRenderPreset,
	layout: { theme: string; layoutDensity: string },
): IStyleConfig {
	const theme = asString(layout.theme, preset.theme);
	const defaultCardBackground = theme === 'dark' ? '#111827' : '#ffffff';

	return {
		theme,
		accentColor: sanitizeColor(asString(styleConfig.accentColor, preset.accentColor), preset.accentColor),
		backgroundColor: sanitizeColor(
			asString(styleConfig.backgroundColor, preset.backgroundColor),
			preset.backgroundColor,
		),
		cardBackgroundColor: sanitizeColor(
			asString(styleConfig.cardBackgroundColor, defaultCardBackground),
			defaultCardBackground,
		),
		textColor: sanitizeColor(asString(styleConfig.textColor, preset.textColor), preset.textColor),
		fontFamily: sanitizeFontFamily(asString(styleConfig.fontFamily, 'Inter, Segoe UI, Roboto, sans-serif')),
		layoutDensity: asString(layout.layoutDensity, preset.layoutDensity),
		cardRadius: clampNumber(Number(styleConfig.cardRadius ?? 12), 0, 28),
		enableShadow: Boolean(styleConfig.enableShadow ?? true),
	};
}

function buildSectionConfig(sectionConfig: JsonObject, preset: IRenderPreset): ISectionConfig {
	return {
		showHeader: Boolean(sectionConfig.showHeader ?? preset.showHeader),
		showKpiSection: Boolean(sectionConfig.showKpiSection ?? preset.showKpiSection),
		showFooter: Boolean(sectionConfig.showFooter ?? preset.showFooter),
		footerText: asString(sectionConfig.footerText, preset.footerText),
	};
}

function buildHtmlDocument(context: IRenderContext): string {
	const padding = context.style.layoutDensity === 'compact' ? '12px' : '18px';
	const shadow = context.style.enableShadow ? '0 8px 24px rgba(15,23,42,0.08)' : 'none';
	const sections = [
		context.sections.showHeader ? renderHeaderSection(context) : '',
		context.sections.showKpiSection ? renderKpiSection(context) : '',
		renderMainSection(context),
		context.sections.showFooter ? renderFooterSection(context) : '',
	]
		.filter(Boolean)
		.join('\n');

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="${escapeHtmlStrict(context.metaDescription)}">
	<title>${escapeHtmlStrict(context.title)}</title>
	<style>
		:root {
			--ui-accent: ${context.style.accentColor};
			--ui-bg: ${context.style.backgroundColor};
			--ui-card-bg: ${context.style.cardBackgroundColor};
			--ui-text: ${context.style.textColor};
			--ui-radius: ${context.style.cardRadius}px;
			--ui-padding: ${padding};
			--ui-shadow: ${shadow};
		}
		* { box-sizing: border-box; }
		body { margin: 0; font-family: ${context.style.fontFamily}; background: var(--ui-bg); color: var(--ui-text); line-height: 1.45; }
		main { max-width: 1120px; margin: 0 auto; padding: 20px 16px 28px 16px; }
		.ui-card { background: var(--ui-card-bg); border-radius: var(--ui-radius); padding: var(--ui-padding); box-shadow: var(--ui-shadow); margin-bottom: 16px; overflow-x: auto; }
		.ui-muted { opacity: 0.8; }
		.ui-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
		.ui-kpi-value { font-size: 1.3rem; font-weight: 700; color: var(--ui-accent); }
		table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
		th, td { text-align: left; border-bottom: 1px solid rgba(148, 163, 184, 0.35); padding: 10px 8px; vertical-align: top; }
		th { font-weight: 600; white-space: nowrap; }
		ul.ui-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
		.ui-list-item { border: 1px solid rgba(148, 163, 184, 0.35); border-radius: calc(var(--ui-radius) - 4px); padding: 10px 12px; }
		.ui-badge { display: inline-block; background: var(--ui-accent); color: #fff; padding: 2px 8px; font-size: 0.75rem; border-radius: 999px; margin-top: 6px; }
		.ui-section-title { font-weight: 800; font-size: 1.15rem; margin: 0 0 8px 0; }
		.ui-section-paragraph { margin: 0; opacity: 0.92; white-space: pre-wrap; }
		.ui-chat { display: flex; flex-direction: column; gap: 12px; }
		.ui-chat-messages { display: flex; flex-direction: column; gap: 10px; }
		.ui-chat-message { display: flex; }
		.ui-chat-message--user { justify-content: flex-end; }
		.ui-chat-message--assistant, .ui-chat-message--system { justify-content: flex-start; }
		.ui-chat-bubble {
			max-width: 82%;
			border-radius: calc(var(--ui-radius) + 4px);
			padding: 10px 12px;
			border: 1px solid rgba(148, 163, 184, 0.35);
			background: var(--ui-card-bg);
		}
		.ui-chat-bubble--user {
			background: var(--ui-accent);
			border-color: rgba(0,0,0,0);
			color: #ffffff;
		}
		.ui-chat-bubble--system {
			background: rgba(148, 163, 184, 0.12);
			border-color: rgba(148, 163, 184, 0.2);
		}
		.ui-chat-content { line-height: 1.45; }
		.ui-chat-meta { margin-top: 6px; font-size: 0.75rem; opacity: 0.72; }
		.ui-chat-role { font-weight: 700; font-size: 0.8rem; opacity: 0.85; }
		.ui-header { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
		.ui-title-block h1 { margin: 0; font-size: 1.5rem; }
		.ui-title-block p { margin: 6px 0 0 0; }
		.ui-logo { max-height: 38px; max-width: 140px; }
		@media (max-width: 720px) { main { padding: 12px; } .ui-card { margin-bottom: 12px; } .ui-title-block h1 { font-size: 1.2rem; } }
		${buildPresetCss(context)}
		${context.chatWidget.enabled ? buildChatWidgetCss(context) : ''}
		${context.customCss}
	</style>
</head>
<body data-preset="${escapeHtmlStrict(context.presetName)}">
	<main>${sections}</main>
	${context.chatWidget.enabled ? renderChatWidgetEmbed(context) : ''}
	${context.chatWidget.enabled ? buildChatWidgetEmbedScript(context) : ''}
</body>
</html>`;
}

function renderHeaderSection(context: IRenderContext): string {
	const logoMarkup = context.logoUrl ? `<img src="${context.logoUrl}" class="ui-logo" alt="Logo">` : '';
	const isSales = context.presetName === 'SalesReport';
	return `<section class="ui-card"><div class="ui-header${isSales ? ' ui-header--sales' : ''}"><div class="ui-title-block${isSales ? ' ui-title-block--center' : ''}"><h1>${escapeHtmlStrict(context.title)}</h1><p class="ui-muted">${escapeHtmlStrict(context.subtitle)}</p></div>${logoMarkup}</div></section>`;
}

function renderKpiSection(context: IRenderContext): string {
	const count = context.items.length;
	const totalFields = context.items.reduce((sum, item) => sum + Object.keys(item).length, 0);
	const avgFields = count > 0 ? Math.round((totalFields / count) * 100) / 100 : 0;
	const generatedAt = asString(context.placeholderMeta.generatedAt, '');
	return `<section class="ui-card"><div class="ui-kpi-grid"><div><div class="ui-muted">Records</div><div class="ui-kpi-value">${count}</div></div><div><div class="ui-muted">Avg Fields / Record</div><div class="ui-kpi-value">${avgFields}</div></div><div><div class="ui-muted">Template</div><div class="ui-kpi-value">${escapeHtmlStrict(context.templateType)}</div></div><div><div class="ui-muted">Generated</div><div class="ui-kpi-value">${escapeHtmlStrict(generatedAt)}</div></div></div></section>`;
}

function renderMainSection(context: IRenderContext): string {
	if (context.compositionMode === 'multi' && Array.isArray(context.blocks) && context.blocks.length > 0) {
		const allItemsEmpty = (context.allItems?.length ?? 0) === 0;
		if (allItemsEmpty) {
			return `<section class="ui-card"><strong>No data</strong><p class="ui-muted">The input dataset is empty.</p></section>`;
		}

		if (context.presetName === 'OpsTable') return renderOpsMultiBlocks(context);

		return context.blocks
			.map((block) => {
				const blockItems: JsonObject[] =
					block.inputMode === 'currentItem'
						? context.items.length > 0
							? [context.items[0]]
							: []
						: context.allItems;

				const blockContext: IRenderContext = {
					...context,
					items: blockItems,
					templateType: block.templateType,
					chartType: block.chartType,
					dataMappingConfig: block.dataMappingConfig,
					blockTitle: block.title,
				};

				const blockHtml =
					block.templateType === 'list'
						? renderListSection(blockContext)
						: block.templateType === 'text'
							? renderTextSection(blockContext)
						: block.templateType === 'chart'
							? renderChartSection(blockContext)
							: renderTableSection(blockContext);

				return blockHtml;
			})
			.join('\n');
	}

	if (context.items.length === 0) {
		return `<section class="ui-card"><strong>No data</strong><p class="ui-muted">The input dataset is empty.</p></section>`;
	}
	if (context.templateType === 'list') return renderListSection(context);
	if (context.templateType === 'sectionText') return renderTextSection(context);
	if (context.templateType === 'chat') return renderChatSection(context);
	if (context.templateType === 'chart') return renderChartSection(context);
	return renderTableSection(context);
}

function renderOpsMultiBlocks(context: IRenderContext): string {
	const blocks = Array.isArray(context.blocks) ? context.blocks : [];
	const result: string[] = [];

	let i = 0;
	while (i < blocks.length) {
		const block = blocks[i];

		if (block.templateType === 'chart') {
			const chartBlocks: IRenderBlockConfig[] = [];
			while (i < blocks.length && blocks[i]?.templateType === 'chart') chartBlocks.push(blocks[i++] as IRenderBlockConfig);

			const chartCards = chartBlocks
				.map((chartBlock) => {
					const blockItems: JsonObject[] =
						chartBlock.inputMode === 'currentItem'
							? context.items.length > 0
								? [context.items[0]]
								: []
							: context.allItems;

					const blockContext: IRenderContext = {
						...context,
						items: blockItems,
						templateType: chartBlock.templateType,
						chartType: chartBlock.chartType,
						dataMappingConfig: chartBlock.dataMappingConfig,
						blockTitle: chartBlock.title,
					};

					return renderChartSection(blockContext);
				})
				.join('\n');

			result.push(`<div class="ui-charts-grid">${chartCards}</div>`);
			continue;
		}

		const blockItems: JsonObject[] =
			block.inputMode === 'currentItem'
				? context.items.length > 0
					? [context.items[0]]
					: []
				: context.allItems;

		const blockContext: IRenderContext = {
			...context,
			items: blockItems,
			templateType: block.templateType,
			chartType: block.chartType,
			dataMappingConfig: block.dataMappingConfig,
			blockTitle: block.title,
		};

		const blockHtml =
			block.templateType === 'list'
				? renderListSection(blockContext)
				: block.templateType === 'text'
					? renderTextSection(blockContext)
					: renderTableSection(blockContext);

		result.push(blockHtml);
		i++;
	}

	return result.join('\n');
}

function renderTableSection(context: IRenderContext): string {
	const fallback = asString(context.dataMappingConfig.missingFieldFallback, '-');
	const itemKeys = unionObjectKeys(context.items);
	const titleHtml = context.blockTitle ? `<div class="ui-muted" style="margin-bottom: 10px;">${escapeHtmlStrict(context.blockTitle)}</div>` : '';

	const tableColumnsUi = context.dataMappingConfig.tableColumnsUi as JsonObject[] | undefined;
	const columnsResolved: Array<{ key: string; header: string }> = [];

	if (Array.isArray(tableColumnsUi) && tableColumnsUi.length > 0) {
		for (let i = 0; i < tableColumnsUi.length; i++) {
			const col = tableColumnsUi[i] as JsonObject;
			const fieldInput = asString(col.field, '');
			if (!fieldInput) continue;

			const headerAlias = asString(col.header, '');
			const fallbackKey = itemKeys[i] ?? itemKeys[0] ?? '';

			const resolvedKey = inferFieldKeyFromMappingInput(
				normalizeFieldPathInput(fieldInput),
				context.items,
				fallbackKey,
			);

			if (!resolvedKey) continue;
			columnsResolved.push({ key: resolvedKey, header: headerAlias || resolvedKey });
		}
	}

	// Fallback to legacy "Column Fields" if the fixedCollection is empty.
	if (columnsResolved.length === 0) {
		const configuredColumns = asString(context.dataMappingConfig.columnFields, '')
			.split(/[,\n;]/g)
			.map((value) => value.trim())
			.filter(Boolean);
		const allKeys = new Set(itemKeys);
		const normalizedConfiguredColumns =
			configuredColumns.length > 0 ? configuredColumns.map(normalizeFieldPathInput) : [];

		// If n8n pre-evaluated expressions like `{{ $json.id }}`, we may end up with literal values
		// instead of keys. In that case, none of the columns match actual keys.
		const matchedColumns =
			normalizedConfiguredColumns.length > 0
				? normalizedConfiguredColumns.filter((c) => allKeys.has(c))
				: [];

		const columns = matchedColumns.length > 0 ? matchedColumns : itemKeys;
		columnsResolved.push(...columns.map((c) => ({ key: c, header: c })));
	}

	if (columnsResolved.length === 0) {
		return `<section class="ui-card"><strong>No data</strong><p class="ui-muted">No fields available for table rendering.</p></section>`;
	}

	const headerRow = columnsResolved.map((col) => `<th>${escapeHtmlStrict(col.header)}</th>`).join('');
	const rows = context.items
		.map((item) => {
			const cells = columnsResolved
				.map((col) => `<td>${escapeHtmlStrict(String(resolveFieldValue(item, col.key, fallback)))}</td>`)
				.join('');
			return `<tr>${cells}</tr>`;
		})
		.join('');

	return `<section class="ui-card">${titleHtml}<table><thead><tr>${headerRow}</tr></thead><tbody>${rows}</tbody></table></section>`;
}

function renderListSection(context: IRenderContext): string {
	const fallback = asString(context.dataMappingConfig.missingFieldFallback, '-');
	const primaryLabel = asString(context.dataMappingConfig.listPrimaryLabel, '');
	const secondaryLabel = asString(context.dataMappingConfig.listSecondaryLabel, '');
	const secondaryAsBadge = Boolean(context.dataMappingConfig.listSecondaryAsBadge ?? true);
	const isTimeline = context.presetName === 'ActivityFeed';
	const titleHtml = context.blockTitle ? `<div class="ui-muted" style="margin-bottom: 10px;">${escapeHtmlStrict(context.blockTitle)}</div>` : '';

	const item0Keys = Object.keys(context.items[0] ?? {});
	const defaultPrimary = item0Keys[0] ?? '';
	const defaultSecondary = item0Keys[1] ?? '';

	const primaryInput = asString(context.dataMappingConfig.listPrimaryField, defaultPrimary);
	const secondaryInput = asString(context.dataMappingConfig.listSecondaryField, defaultSecondary);

	const primaryField = inferFieldKeyFromMappingInput(
		normalizeFieldPathInput(primaryInput),
		context.items,
		defaultPrimary,
	);
	const secondaryField = inferFieldKeyFromMappingInput(
		normalizeFieldPathInput(secondaryInput),
		context.items,
		defaultSecondary,
	);
	const listItems = context.items
		.map((item) => {
			const primaryValue = resolveFieldValue(item, primaryField, fallback);
			const secondaryValue = secondaryField ? resolveFieldValue(item, secondaryField, '') : '';
			const hasSecondary = String(secondaryValue).trim() !== '';

			const primaryLabelMarkup = primaryLabel ? `<div class="ui-muted">${escapeHtmlStrict(primaryLabel)}</div>` : '';
			const primaryValueMarkup = `<div><strong>${escapeHtmlStrict(String(primaryValue))}</strong></div>`;

			if (!hasSecondary) {
				return `<li class="ui-list-item">${primaryLabelMarkup}${primaryValueMarkup}</li>`;
			}

			const secondaryText = String(secondaryValue);
			const secondaryValueMarkup = secondaryAsBadge
				? `<div class="ui-badge">${secondaryLabel ? `${escapeHtmlStrict(secondaryLabel)}: ` : ''}${escapeHtmlStrict(secondaryText)}</div>`
				: `${secondaryLabel ? `<div class="ui-muted">${escapeHtmlStrict(secondaryLabel)}</div>` : ''}<div><strong>${escapeHtmlStrict(secondaryText)}</strong></div>`;

			return `<li class="ui-list-item">${primaryLabelMarkup}${primaryValueMarkup}${secondaryValueMarkup}</li>`;
		})
		.join('');

	if (!isTimeline) {
		return `<section class="ui-card">${titleHtml}<ul class="ui-list">${listItems}</ul></section>`;
	}

	const timelineItems = context.items
		.map((item) => {
			const primaryValue = resolveFieldValue(item, primaryField, fallback);
			const secondaryValue = secondaryField ? resolveFieldValue(item, secondaryField, '') : '';
			const hasSecondary = String(secondaryValue).trim() !== '';

			const primaryLabelMarkup = primaryLabel ? `<div class="ui-timeline-primary-label ui-muted">${escapeHtmlStrict(primaryLabel)}</div>` : '';
			const primaryValueMarkup = `<div class="ui-timeline-primary"><strong>${escapeHtmlStrict(String(primaryValue))}</strong></div>`;

			const secondaryLabelPrefix = secondaryLabel ? `<span class="ui-timeline-secondary-label">${escapeHtmlStrict(secondaryLabel)}: </span>` : '';
			const secondaryMarkup = hasSecondary ? `<div class="ui-timeline-secondary">${secondaryLabelPrefix}${escapeHtmlStrict(String(secondaryValue))}</div>` : '';

			return `<li class="ui-timeline-item"><div class="ui-timeline-dot" aria-hidden="true"></div><div class="ui-timeline-content">${primaryLabelMarkup}${primaryValueMarkup}${secondaryMarkup}</div></li>`;
		})
		.join('');

	return `<section class="ui-card">${titleHtml}<ul class="ui-timeline">${timelineItems}</ul></section>`;
}

function renderTextSection(context: IRenderContext): string {
	const stats: JsonObject = { count: context.items.length };
	const meta = context.placeholderMeta;

	const titleTemplate =
		context.blockTitle && context.blockTitle.trim() !== ''
			? context.blockTitle
			: asString(context.dataMappingConfig.sectionTextTitle, '');
	const paragraphTemplate =
		asString(context.dataMappingConfig.textParagraph, '') !== '' ? asString(context.dataMappingConfig.textParagraph, '') : asString(context.dataMappingConfig.sectionTextParagraph, '');

	const titleResolved = titleTemplate ? resolveTemplateString(titleTemplate, context.items[0], meta, stats, context.allowUnsafeHtml) : '';
	const paragraphResolved = paragraphTemplate
		? resolveTemplateString(paragraphTemplate, context.items[0], meta, stats, context.allowUnsafeHtml)
		: '';

	if (!titleResolved && !paragraphResolved) {
		return `<section class="ui-card"><div class="ui-muted">No text content</div></section>`;
	}

	const titleHtml = titleResolved ? `<div class="ui-section-title">${titleResolved}</div>` : '';
	const paragraphHtml = paragraphResolved ? `<p class="ui-section-paragraph">${paragraphResolved}</p>` : '';

	return `<section class="ui-card">${titleHtml}${paragraphHtml}</section>`;
}

function renderChatSection(context: IRenderContext): string {
	const messagesField = asString(context.dataMappingConfig.chatMessagesField, 'messages');
	const roleField = asString(context.dataMappingConfig.chatRoleField, 'role');
	const contentField = asString(context.dataMappingConfig.chatContentField, 'content');
	const timestampField = asString(context.dataMappingConfig.chatTimestampField, 'timestamp');
	const userRoleValue = asString(context.dataMappingConfig.chatUserRole, 'user');
	const assistantRoleValue = asString(context.dataMappingConfig.chatAssistantRole, 'assistant');
	const systemRoleValue = asString(context.dataMappingConfig.chatSystemRole, 'system');

	type ChatMessage = { role: string; content: string; timestamp?: unknown };
	const messages: ChatMessage[] = [];

	for (const item of context.items) {
		const rawMessages = resolveFieldValue(item, messagesField, null) as unknown;
		if (Array.isArray(rawMessages)) {
			for (const msg of rawMessages) {
				if (!msg || typeof msg !== 'object') continue;
				const msgObj = msg as JsonObject;
				messages.push({
					role: String(resolveFieldValue(msgObj, roleField, 'user') ?? 'user'),
					content: String(resolveFieldValue(msgObj, contentField, '') ?? ''),
					timestamp: resolveFieldValue(msgObj, timestampField, undefined),
				});
			}
			continue;
		}

		// Fallback: treat the item itself as a single message.
		const role = resolveFieldValue(item, roleField, '') as unknown;
		const content = resolveFieldValue(item, contentField, '') as unknown;
		if (String(role).trim() !== '' && String(content).trim() !== '') {
			messages.push({
				role: String(role),
				content: String(content),
				timestamp: resolveFieldValue(item, timestampField, undefined),
			});
		}
	}

	if (messages.length === 0) {
		return `<section class="ui-card"><div class="ui-muted">No chat messages</div></section>`;
	}

	const resolveRoleClass = (role: string): { klass: string; label: string } => {
		if (role === userRoleValue) return { klass: 'ui-chat-message--user', label: 'You' };
		if (role === assistantRoleValue) return { klass: 'ui-chat-message--assistant', label: 'Assistant' };
		if (role === systemRoleValue) return { klass: 'ui-chat-message--system', label: 'System' };
		return { klass: 'ui-chat-message--assistant', label: role || 'Message' };
	};

	const renderContent = (content: string): string => {
		if (content === '') return '';
		return context.allowUnsafeHtml ? content : escapeHtmlStrict(content);
	};

	const messageHtml = messages
		.map((m) => {
			const role = String(m.role ?? '');
			const content = String(m.content ?? '');
			const timestamp = m.timestamp === undefined || m.timestamp === null ? '' : String(m.timestamp);
			const { klass, label } = resolveRoleClass(role);
			const bubbleClass = role === userRoleValue ? 'ui-chat-bubble--user' : role === systemRoleValue ? 'ui-chat-bubble--system' : 'ui-chat-bubble--assistant';

			return `<div class="ui-chat-message ${klass}">
	<div class="ui-chat-bubble ${bubbleClass}">
		<div class="ui-chat-role">${escapeHtmlStrict(label)}</div>
		<div class="ui-chat-content">${renderContent(content)}</div>
		${timestamp ? `<div class="ui-chat-meta">${escapeHtmlStrict(timestamp)}</div>` : ''}
	</div>
	</div>`;
		})
		.join('\n');

	return `<section class="ui-card"><div class="ui-section-title" style="margin-bottom: 12px;">Chat</div><div class="ui-chat">${messageHtml}</div></section>`;
}

function renderChartSection(context: IRenderContext): string {
	const fallback = asString(context.dataMappingConfig.missingFieldFallback, '-');
	const chartType = asString(context.chartType, 'bar');
	const titleHtml = context.blockTitle ? `<div class="ui-muted" style="margin-bottom: 10px;">${escapeHtmlStrict(context.blockTitle)}</div>` : '';
	const chartLabelsMode = asString(context.dataMappingConfig.chartLabelsMode, 'field');
	const chartValuesMode = asString(context.dataMappingConfig.chartValuesMode, 'field');
	const chartHeight = clampNumber(Number(context.dataMappingConfig.chartHeight ?? 220), 100, 800);
	const chartLegendPosition = asString(context.dataMappingConfig.chartLegendPosition, 'top');

	const item0Keys = Object.keys(context.items[0] ?? {});
	const defaultLabelKey = item0Keys[0] ?? '';
	const defaultValueKey = item0Keys[1] ?? '';

	// n8n may pre-evaluate expressions like `{{ $json.month }}` into literal values like "Jan".
	// In that case, we infer the actual key by matching against the first item's values.
	const labelFieldInput = asString(context.dataMappingConfig.chartLabelField, defaultLabelKey);
	const valueFieldInput = asString(context.dataMappingConfig.chartValueField, defaultValueKey);

	const labelFieldResolved =
		chartLabelsMode === 'field'
			? inferFieldKeyFromMappingInput(normalizeFieldPathInput(labelFieldInput), context.items, defaultLabelKey)
			: '';
	const valueFieldResolved =
		chartValuesMode === 'field'
			? inferFieldKeyFromMappingInput(normalizeFieldPathInput(valueFieldInput), context.items, defaultValueKey)
			: '';
	const chartId = `chart_${Math.random().toString(36).slice(2, 10)}`;
	const labels: string[] = [];
	const values: number[] = [];

	const parseStringArray = (raw: string): string[] => {
		try {
			const parsed: unknown = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.map((v) => String(v));
		} catch {
			context.warnings.push('Chart labels array is invalid JSON.');
			return [];
		}
	};

	const parseNumberArray = (raw: string): number[] => {
		try {
			const parsed: unknown = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			const result: number[] = [];
			for (const v of parsed) {
				const n = Number(v);
				if (!Number.isFinite(n)) context.warnings.push('Chart value array contains non-numeric values. Set to 0.');
				result.push(Number.isFinite(n) ? n : 0);
			}
			return result;
		} catch {
			context.warnings.push('Chart values array is invalid JSON.');
			return [];
		}
	};

	if (chartLabelsMode === 'array') {
		const rawLabels = asString(context.dataMappingConfig.chartLabelsArray, '[]');
		labels.push(...parseStringArray(rawLabels));
	}
	if (chartValuesMode === 'array') {
		const rawValues = asString(context.dataMappingConfig.chartValuesArray, '[]');
		values.push(...parseNumberArray(rawValues));
	}

	// Derive missing parts from items depending on the selected modes.
	if (chartLabelsMode === 'field' || chartValuesMode === 'field') {
		for (const item of context.items) {
			if (chartLabelsMode === 'field') {
				labels.push(String(resolveFieldValue(item, labelFieldResolved, fallback)));
			}
			if (chartValuesMode === 'field') {
				const numericValue = Number(resolveFieldValue(item, valueFieldResolved, 0));
				if (!Number.isFinite(numericValue))
					context.warnings.push(`Chart value "${valueFieldResolved}" is not numeric and was set to 0.`);
				values.push(Number.isFinite(numericValue) ? numericValue : 0);
			}
		}
	}

	// Keep labels and values aligned for Chart.js.
	const minLen = Math.min(labels.length, values.length);
	if (labels.length !== values.length) {
		context.warnings.push('Chart labels/values length mismatch. Extra items were truncated.');
	}
	const safeLabels = labels.slice(0, minLen);
	const safeValues = values.slice(0, minLen);
	labels.splice(0, labels.length, ...safeLabels);
	values.splice(0, values.length, ...safeValues);

	const accent = context.style.accentColor;
	const isDark = context.style.theme === 'dark';
	const tooltipBg = isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)';
	const tooltipBorder = isDark ? 'rgba(226,232,240,0.18)' : 'rgba(15,23,42,0.12)';
	const tooltipText = isDark ? '#e2e8f0' : '#0f172a';
	const gridColor = isDark ? 'rgba(226,232,240,0.14)' : 'rgba(15,23,42,0.08)';

	const segmentColors = buildPalette(accent, labels.length, isDark);
	const accentRgba = hexToRgba(accent, isDark ? 0.28 : 0.18);

	const jsTitle = escapeJsString(context.title);
	const jsChartType =
		chartType === 'donut' ? 'doughnut' : chartType === 'polar' ? 'polarArea' : escapeJsString(chartType);

	const legendLabels = {
		color: tooltipText,
		font: { family: context.style.fontFamily, size: 12, weight: '600' },
	};

	const tooltipOptions: JsonObject = {
		backgroundColor: tooltipBg,
		borderColor: tooltipBorder,
		borderWidth: 1,
		titleColor: tooltipText,
		bodyColor: tooltipText,
		padding: 10,
		displayColors: chartType !== 'pie' && chartType !== 'donut',
		callbacks: {
			label: (ctx: unknown) => {
				const anyCtx = ctx as { label?: string; parsed?: unknown } | undefined;
				const label = anyCtx?.label ?? '';
				const parsedUnknown: unknown = anyCtx?.parsed;
				let value: unknown = parsedUnknown;
				if (parsedUnknown && typeof parsedUnknown === 'object') {
					const maybeParsed = parsedUnknown as { y?: unknown; r?: unknown };
					if (typeof maybeParsed.y === 'number') value = maybeParsed.y;
					else if (typeof maybeParsed.r === 'number') value = maybeParsed.r;
				} else if (typeof parsedUnknown === 'number') {
					value = parsedUnknown;
				}
				return `${label}: ${value}`;
			},
		},
	};

	const commonChartOptions: JsonObject = {
		responsive: true,
		maintainAspectRatio: false,
		animation: { duration: 320 },
		plugins: {
			legend: { position: chartLegendPosition, labels: legendLabels },
			tooltip: tooltipOptions,
		},
	};

	// Chart.js options need type-specific branches for better appearance.
	const isPieLike = chartType === 'pie' || chartType === 'donut';
	const options: JsonObject =
		isPieLike
			? {
					...commonChartOptions,
					plugins: {
						legend: { position: chartLegendPosition, labels: legendLabels },
						tooltip: tooltipOptions,
					},
					...(chartType === 'donut' ? { cutout: '65%' } : {}),
			  }
			: chartType === 'polar'
				? {
						...commonChartOptions,
						scales: {
							r: {
								ticks: { color: tooltipText, font: { family: context.style.fontFamily, size: 11 } },
								grid: { color: gridColor },
							},
						},
				  }
				: {
						...commonChartOptions,
						scales: {
							x: {
								ticks: {
									color: tooltipText,
									font: { family: context.style.fontFamily, size: 11 },
									autoSkip: false,
								},
								grid: { color: gridColor },
							},
							y: {
								ticks: { color: tooltipText, font: { family: context.style.fontFamily, size: 11 } },
								grid: { color: gridColor },
							},
						},
				  };

	const dataset: JsonObject =
		chartType === 'line'
			? {
					label: jsTitle,
					data: values,
					backgroundColor: accentRgba,
					borderColor: accent,
					borderWidth: 2,
					tension: 0.35,
					fill: true,
					pointRadius: 4,
					pointHoverRadius: 6,
				  }
			: isPieLike
				? {
						label: jsTitle,
						data: values,
						backgroundColor: segmentColors,
						borderColor: segmentColors,
						borderWidth: 1.2,
						...(chartType === 'pie' ? { hoverOffset: 8 } : {}),
				  }
				: chartType === 'polar'
					? {
							label: jsTitle,
							data: values,
							backgroundColor: segmentColors,
							borderColor: segmentColors,
							borderWidth: 1.0,
					  }
					: {
							label: jsTitle,
							data: values,
							backgroundColor: segmentColors,
							borderColor: segmentColors,
							borderWidth: 1.0,
							borderRadius: 8,
					  };

	return `<section class="ui-card">${titleHtml}<div style="height: ${chartHeight}px; position: relative;"><canvas id="${chartId}"></canvas></div></section>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"></script>
<script>
	(() => {
		const chartNode = document.getElementById('${chartId}');
		if (!chartNode || typeof window.Chart !== 'function') return;

		const ctx = chartNode.getContext('2d');
		if (!ctx) return;

		const chartConfig = {
			type: '${jsChartType}',
			data: {
				labels: ${JSON.stringify(labels)},
				datasets: [${JSON.stringify(dataset)}]
			},
			options: ${JSON.stringify(options)}
		};

		new window.Chart(ctx, chartConfig);
	})();
</script>`;
}

function renderFooterSection(context: IRenderContext): string {
	const footerText = context.sections.footerText || 'Generated by UI Render';
	return `<section class="ui-card"><div class="ui-muted">${escapeHtmlStrict(footerText)}</div></section>`;
}

function buildPresetCss(context: IRenderContext): string {
	const presetName = context.presetName;
	const accentSoft = hexToRgba(context.style.accentColor, context.style.theme === 'dark' ? 0.25 : 0.18);

	let css = '';

	if (presetName === 'SalesReport') {
		css += `
		.ui-header--sales { justify-content: center; position: relative; }
		.ui-header--sales .ui-logo { position: absolute; right: 0; top: 50%; transform: translateY(-50%); }
		.ui-title-block--center { text-align: center; }
		.ui-header--sales .ui-title-block h1 { font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em; }
		.ui-header--sales .ui-title-block p { margin-top: 8px; font-size: 1rem; }
		`;
	}

	if (presetName === 'OpsTable') {
		css += `
		.ui-charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; margin-bottom: 16px; padding-bottom: 2px; }
		.ui-charts-grid .ui-card { margin-bottom: 0; }
		`;
	}

	if (presetName === 'ActivityFeed') {
		css += `
		.ui-timeline { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
		.ui-timeline-item { display: flex; align-items: flex-start; gap: 12px; position: relative; }
		.ui-timeline-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--ui-accent); margin-top: 7px; box-shadow: 0 0 0 4px ${accentSoft}; flex: 0 0 auto; }
		.ui-timeline-content { min-width: 0; }
		.ui-timeline-primary { line-height: 1.25; }
		.ui-timeline-primary-label { font-size: 0.85rem; margin-bottom: 2px; }
		.ui-timeline-secondary { margin-top: 4px; font-size: 0.92rem; }
		.ui-timeline-secondary-label { font-weight: 600; opacity: 0.9; }
		.ui-timeline-item:not(:last-child)::after { content: ''; position: absolute; left: 5px; top: 20px; bottom: -14px; width: 2px; background: rgba(148, 163, 184, 0.35); }
		`;
	}

	return css;
}

function buildChatWidgetCss(context: IRenderContext): string {
	return `
		.ui-chat-widget-launcher {
			position: fixed;
			right: 18px;
			bottom: 18px;
			width: 56px;
			height: 56px;
			border-radius: 999px;
			border: none;
			background: var(--ui-accent);
			box-shadow: 0 10px 30px rgba(0,0,0,0.15);
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			z-index: 9999;
		}
		.ui-chat-widget-launcher:focus { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 3px; }
		.ui-chat-widget-panel {
			position: fixed;
			right: 18px;
			bottom: 86px;
			width: min(420px, 92vw);
			height: ${context.chatWidget.height}px;
			max-height: calc(100vh - 110px);
			border-radius: calc(var(--ui-radius) + 8px);
			background: var(--ui-card-bg);
			color: var(--ui-text);
			border: 1px solid rgba(148, 163, 184, 0.35);
			box-shadow: 0 16px 40px rgba(15,23,42,0.14);
			z-index: 9999;
			display: none;
			flex-direction: column;
			overflow: hidden;
		}
		.ui-chat-widget-panel--open { display: flex; }
		.ui-chat-widget-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 12px;
			background: rgba(148, 163, 184, 0.10);
			border-bottom: 1px solid rgba(148, 163, 184, 0.25);
		}
		.ui-chat-widget-title {
			font-weight: 800;
			font-size: 0.95rem;
		}
		.ui-chat-widget-close {
			width: 34px;
			height: 34px;
			border-radius: 999px;
			border: none;
			background: rgba(148, 163, 184, 0.22);
			color: var(--ui-text);
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}
		.ui-chat-widget-iframe {
			display: none;
		}
		.ui-chat-widget-messages {
			flex: 1 1 auto;
			min-height: 0;
			overflow: auto;
			padding: 12px;
			background: rgba(148, 163, 184, 0.06);
		}
		.ui-chat-widget-composer {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 10px 12px;
			border-top: 1px solid rgba(148, 163, 184, 0.25);
			background: rgba(255,255,255,0.02);
		}
		.ui-chat-widget-input {
			flex: 1 1 auto;
			min-width: 0;
			border: 1px solid rgba(148, 163, 184, 0.35);
			border-radius: 12px;
			padding: 10px 12px;
			background: var(--ui-bg);
			color: var(--ui-text);
			font-family: inherit;
			font-size: 0.95rem;
			outline: none;
		}
		.ui-chat-widget-input:focus {
			border-color: rgba(37, 99, 235, 0.55);
			box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
		}
		.ui-chat-widget-send {
			border: none;
			border-radius: 12px;
			padding: 10px 12px;
			background: var(--ui-accent);
			color: #ffffff;
			font-weight: 800;
			cursor: pointer;
			white-space: nowrap;
		}
		.ui-chat-widget-send:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}
		.ui-chat-widget-row {
			display: flex;
			margin-bottom: 10px;
		}
		.ui-chat-widget-row--user { justify-content: flex-end; }
		.ui-chat-widget-row--assistant { justify-content: flex-start; }
		.ui-chat-widget-bubble {
			max-width: 92%;
			border-radius: calc(var(--ui-radius) + 6px);
			padding: 10px 12px;
			border: 1px solid rgba(148, 163, 184, 0.35);
			background: var(--ui-card-bg);
			color: var(--ui-text);
			line-height: 1.4;
			white-space: pre-wrap;
			word-break: break-word;
		}
		.ui-chat-widget-bubble--user {
			background: var(--ui-accent);
			color: #ffffff;
			border-color: rgba(0,0,0,0);
		}
	`;
}

function renderChatWidgetEmbed(context: IRenderContext): string {
	const safeAria = escapeHtmlStrict(context.chatWidget.launcherAriaLabel || 'Open chat');
	const safeTitle = escapeHtmlStrict(context.chatWidget.launcherTitle || 'Chat');

	return `
	<button
		type="button"
		class="ui-chat-widget-launcher"
		id="ui-chat-widget-launcher"
		aria-label="${safeAria}"
		aria-controls="ui-chat-widget-panel"
		aria-expanded="false"
	>
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path d="M7 7.5C7 6.11929 8.11929 5 9.5 5H18.5C19.8807 5 21 6.11929 21 7.5V14C21 15.3807 19.8807 16.5 18.5 16.5H12.2L8.3 19.5V16.5H9.5C8.11929 16.5 7 15.3807 7 14V7.5Z" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
			<path d="M3.5 4.5H4.2" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
		</svg>
	</button>

	<div class="ui-chat-widget-panel" id="ui-chat-widget-panel" aria-hidden="true">
		<div class="ui-chat-widget-header">
			<div class="ui-chat-widget-title">${safeTitle}</div>
			<button type="button" class="ui-chat-widget-close" id="ui-chat-widget-close" aria-label="Close chat">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					<path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			</button>
		</div>
		<div class="ui-chat-widget-messages" id="ui-chat-widget-messages"></div>
		<form class="ui-chat-widget-composer" id="ui-chat-widget-form">
			<input
				class="ui-chat-widget-input"
				id="ui-chat-widget-input"
				name="message"
				type="text"
				autocomplete="off"
				spellcheck="true"
				placeholder="Type your message…"
			/>
			<button class="ui-chat-widget-send" id="ui-chat-widget-send" type="submit">Send</button>
		</form>
	</div>
	`;
}

function buildChatWidgetEmbedScript(context: IRenderContext): string {
	return `
	<script>
	(() => {
		const launcher = document.getElementById('ui-chat-widget-launcher');
		const panel = document.getElementById('ui-chat-widget-panel');
		const closeBtn = document.getElementById('ui-chat-widget-close');
			const messages = document.getElementById('ui-chat-widget-messages');
			const form = document.getElementById('ui-chat-widget-form');
			const input = document.getElementById('ui-chat-widget-input');
			const sendBtn = document.getElementById('ui-chat-widget-send');
			if (!launcher || !panel || !closeBtn || !messages || !form || !input || !sendBtn) return;

		const setOpen = (open) => {
			panel.classList.toggle('ui-chat-widget-panel--open', open);
			panel.setAttribute('aria-hidden', String(!open));
			launcher.setAttribute('aria-expanded', String(open));
		};

		launcher.addEventListener('click', () => setOpen(true));
		closeBtn.addEventListener('click', () => setOpen(false));
		window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

			function getSessionId() {
				const urlKey = String(${JSON.stringify(context.chatWidget.url)});
				let h = 0;
				for (let i = 0; i < urlKey.length; i++) h = (h * 31 + urlKey.charCodeAt(i)) >>> 0;
				const key = 'ui-renderer-chat-session-' + h;
				try {
					const existing = localStorage.getItem(key);
					if (existing) return existing;
				} catch {}
				const next = 's_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
				try { localStorage.setItem(key, next); } catch {}
				return next;
			}

			function escapeHtml(s) {
				return String(s ?? '')
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&#39;');
			}

			function appendMessage(role, text) {
				const row = document.createElement('div');
				row.className = 'ui-chat-widget-row ' + (role === 'user' ? 'ui-chat-widget-row--user' : 'ui-chat-widget-row--assistant');
				const bubble = document.createElement('div');
				bubble.className = 'ui-chat-widget-bubble ' + (role === 'user' ? 'ui-chat-widget-bubble--user' : '');
				bubble.innerHTML = escapeHtml(text);
				row.appendChild(bubble);
				messages.appendChild(row);
				messages.scrollTop = messages.scrollHeight;
			}

			function pickAssistantText(data) {
				if (data === null || data === undefined) return '';
				if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return String(data);
				if (Array.isArray(data)) {
					for (const item of data) {
						const t = pickAssistantText(item);
						if (t) return t;
					}
					return '';
				}
				if (typeof data === 'object') {
					if (typeof data.reply === 'string') return data.reply;
					if (typeof data.message === 'string') return data.message;
					if (typeof data.answer === 'string') return data.answer;
					if (typeof data.text === 'string') return data.text;
					if (typeof data.output === 'string') return data.output;
				}
				try { return JSON.stringify(data); } catch { return String(data); }
			}

			let isLoading = false;
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				if (isLoading) return;

				const text = String(input.value ?? '').trim();
				if (!text) return;

				input.value = '';
				appendMessage('user', text);
				isLoading = true;
				sendBtn.disabled = true;
				const prevBtnText = sendBtn.textContent;
				sendBtn.textContent = '…';

				try {
					const sessionId = getSessionId();
					const res = await fetch(${JSON.stringify(context.chatWidget.url)}, {
						method: 'POST',
						mode: 'cors',
						credentials: 'omit',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							sessionId,
							message: text,
							chatInput: text,
						}),
					});

					let assistantText = '';
					try {
						const data = await res.json();
						assistantText = pickAssistantText(data);
					} catch {
						assistantText = await res.text();
					}

					if (!assistantText) assistantText = '(No response)';
					appendMessage('assistant', assistantText);
				} catch (err) {
					appendMessage('assistant', 'Chat request failed. Please try again.');
				} finally {
					isLoading = false;
					sendBtn.disabled = false;
					sendBtn.textContent = prevBtnText;
					setTimeout(() => input.focus(), 50);
				}
			});

		setOpen(false);
	})();
	</script>
	`;
}

function unionObjectKeys(items: JsonObject[]): string[] {
	const set = new Set<string>();
	for (const item of items) for (const key of Object.keys(item ?? {})) set.add(key);
	return [...set];
}

function buildPalette(accentHex: string, count: number, isDark: boolean): string[] {
	if (count <= 0) return [];
	const base = sanitizeColor(accentHex, isDark ? '#3b82f6' : '#2563eb');
	const rgb = hexToRgb(base) ?? { r: 37, g: 99, b: 235 };
	const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
	const result: string[] = [];
	const hueSpread = isDark ? 34 : 26;
	const sat = clamp(0.7 * 100, 40, 95) / 100;
	const baseS = hsl.s;
	const baseL = hsl.l;

	for (let i = 0; i < count; i++) {
		const t = count === 1 ? 0.5 : i / (count - 1);
		const hue = (hsl.h + (t - 0.5) * hueSpread + 360) % 360;
		const lightness = clamp(baseL + (t - 0.5) * (isDark ? 0.16 : 0.14), 0.18, 0.72);
		const s = clamp(baseS, sat, 0.98);
		result.push(hslToHex(hue, s, lightness));
	}
	return result;
}

function hexToRgba(hex: string, alpha: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return `rgba(37,99,235,${alpha})`;
	return `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(alpha, 0, 1)})`;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const match = /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.exec(hex.trim());
	if (!match) return null;
	let normalized = match[1];
	if (normalized.length === 3) normalized = normalized.split('').map((c) => c + c).join('');
	const n = parseInt(normalized, 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const delta = max - min;

	let h = 0;
	const l = (max + min) / 2;
	const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

	if (delta !== 0) {
		switch (max) {
			case rn:
				h = ((gn - bn) / delta) % 6;
				break;
			case gn:
				h = (bn - rn) / delta + 2;
				break;
			case bn:
				h = (rn - gn) / delta + 4;
				break;
		}
		h *= 60;
		if (h < 0) h += 360;
	}

	return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
	// Convert HSL to RGB then to hex.
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r1: number;
	let g1: number;
	let b1: number;

	if (0 <= h && h < 60) {
		r1 = c;
		g1 = x;
		b1 = 0;
	} else if (60 <= h && h < 120) {
		r1 = x;
		g1 = c;
		b1 = 0;
	} else if (120 <= h && h < 180) {
		r1 = 0;
		g1 = c;
		b1 = x;
	} else if (180 <= h && h < 240) {
		r1 = 0;
		g1 = x;
		b1 = c;
	} else if (240 <= h && h < 300) {
		r1 = x;
		g1 = 0;
		b1 = c;
	} else {
		r1 = c;
		g1 = 0;
		b1 = x;
	}

	const r = Math.round((r1 + m) * 255);
	const g = Math.round((g1 + m) * 255);
	const b = Math.round((b1 + m) * 255);
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function escapeJsString(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

function resolveTemplateString(
	template: string,
	item: JsonObject | undefined,
	meta: JsonObject,
	stats: JsonObject,
	allowUnsafeHtml: boolean,
): string {
	const baseItem = item ?? {};
	return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_whole, rawExpression: string) => {
		const expression = rawExpression.trim();
		const value = resolveExpression(expression, baseItem, meta, stats);
		const serialized = value === undefined || value === null ? '' : String(value);
		return allowUnsafeHtml ? serialized : escapeHtmlStrict(serialized);
	});
}

function resolveExpression(expression: string, item: JsonObject, meta: JsonObject, stats: JsonObject): unknown {
	if (expression.startsWith('item.')) return readPath(item, expression.slice(5));
	if (expression.startsWith('meta.')) return readPath(meta, expression.slice(5));
	if (expression.startsWith('stats.')) return readPath(stats, expression.slice(6));
	return '';
}

function readPath(source: JsonObject, path: string): unknown {
	const chunks = path.split('.').filter(Boolean);
	let cursor: unknown = source;
	for (const chunk of chunks) {
		if (!cursor || typeof cursor !== 'object') return undefined;
		cursor = (cursor as JsonObject)[chunk];
	}
	return cursor;
}

function resolveFieldValue(source: JsonObject, fieldName: string, fallback: unknown): unknown {
	if (!fieldName) return fallback;
	return readPath(source, fieldName) ?? fallback;
}

function normalizeItems(items: INodeExecutionData[]): JsonObject[] {
	return items.map((item) => (item.json ?? {}) as JsonObject);
}

function escapeHtmlStrict(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function sanitizeColor(value: string, fallback: string): string {
	return /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(value.trim()) ? value.trim() : fallback;
}

function sanitizeFontFamily(value: string): string {
	return value.replace(/[^a-zA-Z0-9,\-\s]/g, '').trim() || 'Inter, Segoe UI, Roboto, sans-serif';
}

function sanitizeCustomCss(value: string, warnings: string[]): string {
	if (!value) return '';
	if (value.toLowerCase().includes('<script') || value.toLowerCase().includes('</script>')) {
		warnings.push('Script tags were removed from custom CSS.');
		return value.replace(/<\/?script[^>]*>/gi, '');
	}
	return value;
}

function sanitizeUrl(value: string, warnings: string[]): string {
	if (!value) return '';
	try {
		const parsed = new URL(value);
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return value;
		warnings.push('Logo URL protocol not allowed. Only http/https are accepted.');
		return '';
	} catch {
		warnings.push('Logo URL is invalid and has been ignored.');
		return '';
	}
}

function asString(value: unknown, fallback: string): string {
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	return trimmed === '' ? fallback : trimmed;
}

function normalizeFieldPathInput(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) return '';

	// Accept n8n-like expressions: {{ $json.some.path }} or {{ $json['someKey'] }}.
	// Note: n8n may sometimes serialize parameter values with extra whitespace/newlines
	// around the expression; use non-anchored matching to be resilient.
	const jsonDotMatch = /\{\{\s*\$json\.([a-zA-Z0-9_$.]+)\s*\}\}/.exec(trimmed);
	if (jsonDotMatch) return jsonDotMatch[1];

	const jsonBracketMatch = /\{\{\s*\$json\[['"]([^'"]+)['"]\]\s*\}\}/.exec(trimmed);
	if (jsonBracketMatch) return jsonBracketMatch[1];

	// Also accept placeholder style we use elsewhere: {{item.some.path}}
	const itemDotMatch = /\{\{\s*item\.([a-zA-Z0-9_$.]+)\s*\}\}/.exec(trimmed);
	if (itemDotMatch) return itemDotMatch[1];

	return trimmed;
}

function inferFieldKeyFromMappingInput(input: string, items: JsonObject[], fallbackKey: string): string {
	const trimmed = input.trim();
	if (!trimmed) return fallbackKey;

	const unionKeys = unionObjectKeys(items);
	const normalizedMaybeKey = normalizeFieldPathInput(trimmed);
	if (normalizedMaybeKey && unionKeys.includes(normalizedMaybeKey)) return normalizedMaybeKey;

	// If n8n pre-evaluated an expression, we may receive a literal value (e.g. "Alpha Corp"),
	// so we infer the key by matching the value against the first item.
	const first = items[0] ?? {};
	for (const key of Object.keys(first)) {
		const v = first[key];
		if (v === undefined || v === null) continue;
		if (String(v) === trimmed) return key;
	}

	return fallbackKey || unionKeys[0] || '';
}

function clampNumber(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, value));
}
