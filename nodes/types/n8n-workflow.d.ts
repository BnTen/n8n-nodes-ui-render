declare module 'n8n-workflow' {
	export interface JsonObject {
		[key: string]: unknown;
	}

	export interface INodeExecutionData {
		json: JsonObject;
		pairedItem?: number;
		error?: unknown;
	}

	export interface INodeProperties {
		[key: string]: unknown;
	}

	export interface INodeTypeDescription {
		[key: string]: unknown;
	}

	export interface INodeType {
		description: INodeTypeDescription;
	}

	export interface IExecuteFunctions {
		getInputData(itemIndex?: number): INodeExecutionData[];
		getNodeParameter(name: string, itemIndex: number, fallback?: unknown): unknown;
		getNode(): unknown;
		continueOnFail(): boolean;
	}

	export const NodeConnectionTypes: {
		Main: string;
	};

	export class NodeOperationError extends Error {
		context?: { itemIndex?: number };
		constructor(node: unknown, error: unknown, options?: { itemIndex?: number });
	}
}
