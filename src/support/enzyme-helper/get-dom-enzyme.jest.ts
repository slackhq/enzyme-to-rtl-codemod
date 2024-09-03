import fs from 'fs';
import * as getDomEnzyme from './get-dom-enzyme';
import { runCommand } from '../shell-helper/shell-helper';

// Mocks
jest.mock('fs');
jest.mock('../config/config', () => ({
    getConfigProperty: jest.fn(),
}));
jest.mock('../shell-helper/shell-helper');

const {
    overwriteEnzymeMounts,
    getenzymeRenderAdapterCode,
    createEnzymeAdapter,
    runJestInChildProcess,
    getDomTreeOutputFromFile,
    getReactCompDom,
    getDomEnzymeLogger,
    overwriteRelativeImports,
} = getDomEnzyme;

describe('overwriteEnzymeMounts', () => {
    const filePath = 'testFile.js';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should replace enzyme import statement correctly', () => {
        const fileContent = `
            import { mount } from 'enzyme';
            const a = 1;
            import { method } from '../utils/utils-test'
            `;
        const expectedContent = `
            import { mount, shallow } from './enzyme-mount-adapter';
            const a = 1;
            import { method } from '../utils/utils-test'
            `;

        // Mock readFileSync to return the file content
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        // Mock writeFileSync
        (fs.writeFileSync as jest.Mock).mockImplementation();

        const result = overwriteEnzymeMounts(filePath);

        // Check if readFileSync was called with the correct file path
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');

        // Check output
        expect(result).toEqual(expectedContent);
    });

    it('should not match and return the same fileContent', () => {
        const fileContent =
            "import { somethingElse } from 'some-library';\nconst a = 1;";
        const expectedContent =
            "import { somethingElse } from 'some-library';\nconst a = 1;";

        // Mock readFileSync to return the file content
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        const result = overwriteEnzymeMounts(filePath);

        // Check if readFileSync was called with the correct file path
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');

        // Check output
        expect(result).toEqual(expectedContent);
    });
});

describe('overwriteRelativeImports', () => {
    it('should call convertRelativeImports with correct arguments', () => {
        const filePathRelative =
            'src/support/ast-transformations/individual-transformations/test/convert-enzyme-imports.jest.ts';
        const fileContent =
            "import { addComment } from '../../utils/add-comment';";

        const result = overwriteRelativeImports(filePathRelative, fileContent);

        // Verify a part of the abosolute path is present for the import
        expect(result).toBeDefined();
        expect(result).toContain(
            'enzyme-to-rtl-codemod/src/support/ast-transformations/utils/add-comment',
        );
    });
});

describe('getenzymeRenderAdapterCode', () => {
    it('should generate JS adapter code when the file is a JS file', () => {
        const collectedDomTreeFilePath = 'path/to/test.js';

        const actualCode = getenzymeRenderAdapterCode(
            16,
            collectedDomTreeFilePath,
        );
        expect(actualCode).toContain(
            "import enzyme, { mount as originalMount, shallow as originalShallow } from 'enzyme';",
        );
        expect(actualCode).toContain(collectedDomTreeFilePath);
        expect(actualCode).toContain(
            "import Adapter from 'enzyme-adapter-react-16';",
        );
        expect(actualCode).toContain(
            'enzyme.configure({ adapter: new Adapter() });',
        );
    });
});

describe('createEnzymeAdapter', () => {
    it('should create enzyme adapter file with the correct content and path', () => {
        // Mock only for this test case
        const collectedDomTreeFilePath = '/path/to/domTree.csv';
        const enzymeMountAdapterFilePath = '/path/to/enzymeMountAdapter.js';

        // Mock render adapter code
        const getenzymeRenderAdapterCodeMock = jest.spyOn(
            getDomEnzyme,
            'getenzymeRenderAdapterCode',
        );

        const enzymeRenderAdapterCode =
            "import enzyme, { mount as originalMount, shallow as originalShallow } from 'enzyme';";

        getenzymeRenderAdapterCodeMock.mockReturnValue(enzymeRenderAdapterCode);

        // Run the method
        createEnzymeAdapter(
            16,
            collectedDomTreeFilePath,
            enzymeMountAdapterFilePath,
        );

        // Assert
        expect(getenzymeRenderAdapterCodeMock).toHaveBeenCalledWith(
            16,
            collectedDomTreeFilePath,
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            enzymeMountAdapterFilePath,
            enzymeRenderAdapterCode,
            'utf-8',
        );
    });
});

describe('runJestInChildProcess', () => {
    it('should generate the correct jest command and run it', () => {
        const pathToJestBinary = '/path/to/jestBinary';
        const filePathWithEnzymeAdapter = 'path/to/filePathWithEnzymeAdapter';

        const mockedRunCommand = runCommand as jest.MockedFunction<
            typeof runCommand
        >;

        runJestInChildProcess(pathToJestBinary, filePathWithEnzymeAdapter);

        expect(mockedRunCommand).toHaveBeenCalledTimes(1);
        expect(mockedRunCommand).toHaveBeenCalledWith(
            `${pathToJestBinary} ${filePathWithEnzymeAdapter}`,
        );
    });
});

describe('getDomTreeOutputFromFile', () => {
    it('should get correct file path and read a file', () => {
        const collectedDomTreeFilePath = '/path/to/collectedDomTreeFilePath';

        // Mock readFileSync to return the file content
        const fileContent = 'DOMlogs';
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        const domTreeOutput = getDomTreeOutputFromFile(
            collectedDomTreeFilePath,
        );

        // Check if readFileSync was called with the correct file path
        expect(fs.readFileSync).toHaveBeenCalledWith(
            collectedDomTreeFilePath,
            'utf-8',
        );
        expect(domTreeOutput).toEqual(fileContent);
    });
});

describe('getReactCompDom', () => {
    const filePath = 'testFile.js';
    const domTreeOutput = '<div>Mock DOM Tree</div>';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return a warning message when Enzyme imports are not present', async () => {
        const spyWarn = jest.spyOn(getDomEnzymeLogger, 'warn');

        const enzymeImportsPresent = false;
        const filePathWithEnzymeAdapter = 'path/to/filePathWithEnzymeAdapter';
        const collectedDomTreeFilePath = 'path/to/collectedDomTreeFilePath';
        const enzymeMountAdapterFilePath = 'path/to/enzymeMountAdapterFilePath';
        const jestBinaryPath = 'path/to/jestBinaryPath';
        const reactVersion = 16;

        // Run the method
        const result = await getReactCompDom(
            filePath,
            enzymeImportsPresent,
            filePathWithEnzymeAdapter,
            collectedDomTreeFilePath,
            enzymeMountAdapterFilePath,
            jestBinaryPath,
            reactVersion,
        );

        // Assert
        expect(result).toBe(
            'Could not collect DOM for test cases. Proceed without DOM',
        );
        expect(spyWarn).toHaveBeenCalledWith(
            'No Enzyme imports present. Cannot collect logs. Continue...',
        );
    });

    it('should proceed with collecting DOM when Enzyme imports are present', async () => {
        const enzymeImportsPresent = true;
        const filePathWithEnzymeAdapter = 'path/to/filePathWithEnzymeAdapter';
        const collectedDomTreeFilePath = 'path/to/collectedDomTreeFilePath';
        const enzymeMountAdapterFilePath = 'path/to/enzymeMountAdapterFilePath';
        const jestBinaryPath = 'path/to/jestBinaryPath';
        const reactVersion = 16;

        // Spy on functions
        const createEnzymeAdapterMock = jest.spyOn(
            getDomEnzyme,
            'createEnzymeAdapter',
        );
        const enzymeOverwriteMockContent = `
                import { mount, shallow } from './enzyme-mount-adapter';
                import { testUtil } from '../utils/test-util';
                `;
        const overwriteEnzymeMountsMock = jest
            .spyOn(getDomEnzyme, 'overwriteEnzymeMounts')
            .mockReturnValue(enzymeOverwriteMockContent);
        const overwriteRelativeImportsMock = jest
            .spyOn(getDomEnzyme, 'overwriteRelativeImports')
            .mockReturnValue('');
        const runJestInChildProcessMock = jest
            .spyOn(getDomEnzyme, 'runJestInChildProcess')
            .mockResolvedValue('');
        const getDomTreeOutputFromFileMock = jest
            .spyOn(getDomEnzyme, 'getDomTreeOutputFromFile')
            .mockReturnValue(domTreeOutput);

        // Run the method
        const result = await getReactCompDom(
            filePath,
            enzymeImportsPresent,
            filePathWithEnzymeAdapter,
            collectedDomTreeFilePath,
            enzymeMountAdapterFilePath,
            jestBinaryPath,
            reactVersion,
        );

        // Assert
        expect(result).toBe(domTreeOutput);
        expect(createEnzymeAdapterMock).toHaveBeenCalled();
        expect(overwriteEnzymeMountsMock).toHaveBeenCalledWith(filePath);
        expect(overwriteRelativeImportsMock).toHaveBeenCalledWith(
            filePath,
            enzymeOverwriteMockContent,
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
        expect(runJestInChildProcessMock).toHaveBeenCalledWith(
            jestBinaryPath,
            filePathWithEnzymeAdapter,
        );
        expect(getDomTreeOutputFromFileMock).toHaveBeenCalled();
    });
});
