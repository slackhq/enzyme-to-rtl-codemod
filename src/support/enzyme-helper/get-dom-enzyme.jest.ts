import fs from 'fs';
import * as getDomEnzyme from './get-dom-enzyme';
import { getConfigProperty } from '../config';
import { runCommand } from '../shell-helper/shell-helper';

// Mocks
jest.mock('fs');
jest.mock('../config', () => ({
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
} = getDomEnzyme;

describe('overwriteEnzymeMounts', () => {
    const filePath = 'testFile.js';
    const filePathWithEnzymeAdapter = 'testFileWithAdapter.js';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should replace the import statement correctly', async () => {
        const fileContent = "import { mount } from 'enzyme';\nconst a = 1;";
        const expectedContent =
            "import { mount, shallow } from './enzyme-mount-adapter';\nconst a = 1;";

        // Mock readFileSync to return the file content
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        // Mock writeFileSync
        (fs.writeFileSync as jest.Mock).mockImplementation();

        await overwriteEnzymeMounts(filePath, filePathWithEnzymeAdapter);

        // Check if readFileSync was called with the correct file path
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');

        // Check if writeFileSync was called with the correct arguments
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            filePathWithEnzymeAdapter,
            expectedContent,
            'utf-8',
        );
    });

    it('should not match and write file', async () => {
        const fileContent =
            "import { somethingElse } from 'some-library';\nconst a = 1;";

        // Mock readFileSync to return the file content
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        // Mock writeFileSync
        (fs.writeFileSync as jest.Mock).mockImplementation();

        overwriteEnzymeMounts(filePath, filePathWithEnzymeAdapter);

        // Check if readFileSync was called with the correct file path
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');

        // Check if writeFileSync was not called
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});

describe('getenzymeRenderAdapterCode', () => {
    const collectedDomTreeFilePath = 'path/to/test.js';

    it('should generate JS adapter code when the file is a JS file', () => {
        const actualCode = getenzymeRenderAdapterCode(collectedDomTreeFilePath);
        expect(actualCode).toContain(
            "import enzyme, { mount as originalMount, shallow as originalShallow } from 'enzyme';",
        );
        expect(actualCode).toContain(collectedDomTreeFilePath);
    });
});

describe('createEnzymeAdapter', () => {
    it('should create enzyme adapter file with the correct content and path', () => {
        // Mock config props
        const getConfigPropertyMock = getConfigProperty as jest.MockedFunction<
            typeof getConfigProperty
        >;

        // Mock only for this test case
        const domTreeFilePath = '/path/to/domTree.csv';
        const enzymeMountAdapterFilePath = '/path/to/enzymeMountAdapter.js';

        getConfigPropertyMock.mockImplementation((property) => {
            if (property === 'collectedDomTreeFilePath') return domTreeFilePath;
            if (property === 'enzymeMountAdapterFilePath')
                return enzymeMountAdapterFilePath;
            return '';
        });

        // Mock render adapter code
        const getenzymeRenderAdapterCodeMock = jest.spyOn(
            getDomEnzyme,
            'getenzymeRenderAdapterCode',
        );

        const enzymeRenderAdapterCode =
            "import enzyme, { mount as originalMount, shallow as originalShallow } from 'enzyme';";

        getenzymeRenderAdapterCodeMock.mockReturnValue(enzymeRenderAdapterCode);

        // Run the method
        createEnzymeAdapter();

        // Assert
        expect(getConfigPropertyMock).toHaveBeenCalledWith(
            'collectedDomTreeFilePath',
        );
        expect(getenzymeRenderAdapterCodeMock).toHaveBeenCalledWith(
            domTreeFilePath,
        );
        expect(getConfigPropertyMock).toHaveBeenCalledWith(
            'enzymeMountAdapterFilePath',
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
        // Mock config props
        const getConfigPropertyMock = getConfigProperty as jest.MockedFunction<
            typeof getConfigProperty
        >;
        getConfigPropertyMock.mockReturnValueOnce('/path/to/jestBinary');

        const mockedRunCommand = runCommand as jest.MockedFunction<
            typeof runCommand
        >;

        runJestInChildProcess('path/to/filePathWithEnzymeAdapter');

        expect(mockedRunCommand).toHaveBeenCalledTimes(1);
        expect(mockedRunCommand).toHaveBeenCalledWith(
            '/path/to/jestBinary path/to/filePathWithEnzymeAdapter',
        );
    });
});

describe('getDomTreeOutputFromFile', () => {
    it('should get correct file path and read a file', () => {
        // Mock config props
        const getConfigPropertyMock = getConfigProperty as jest.MockedFunction<
            typeof getConfigProperty
        >;
        getConfigPropertyMock.mockReturnValueOnce(
            '/path/to/collectedDomTreeFilePath',
        );

        // Mock readFileSync to return the file content
        const fileContent = 'DOMlogs';
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        getDomTreeOutputFromFile();

        // Check if readFileSync was called with the correct file path
        expect(fs.readFileSync).toHaveBeenCalledWith(
            '/path/to/collectedDomTreeFilePath',
            'utf-8',
        );
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

        // Mock config props
        const getConfigPropertyMock = getConfigProperty as jest.MockedFunction<
            typeof getConfigProperty
        >;

        getConfigPropertyMock.mockReturnValue('');

        // Run the method
        const result = await getReactCompDom(filePath);

        // Assert
        expect(result).toBe(
            'Could not collect DOM for test cases. Proceed without DOM',
        );
        expect(spyWarn).toHaveBeenCalledWith(
            'No Enzyme imports present. Cannot collect logs. Continue...',
        );
    });

    it('should proceed with collecting DOM when Enzyme imports are present', async () => {
        // Mock getConfigProperty to return true for enzymeImportsPresent and mock other properties
        (getConfigProperty as jest.Mock).mockImplementation((property) => {
            if (property === 'enzymeImportsPresent') return true;
            if (property === 'filePathWithEnzymeAdapter')
                return 'testFileWithAdapter.js';
            return '';
        });

        // Spy on functions
        const createEnzymeAdapterMock = jest.spyOn(
            getDomEnzyme,
            'createEnzymeAdapter',
        );
        const overwriteEnzymeMountsMock = jest
            .spyOn(getDomEnzyme, 'overwriteEnzymeMounts')
            .mockResolvedValue();
        const runJestInChildProcessMock = jest
            .spyOn(getDomEnzyme, 'runJestInChildProcess')
            .mockResolvedValue();
        const getDomTreeOutputFromFileMock = jest
            .spyOn(getDomEnzyme, 'getDomTreeOutputFromFile')
            .mockReturnValue(domTreeOutput);

        // Run the method
        const result = await getReactCompDom(filePath);

        // Assert
        expect(result).toBe(domTreeOutput);
        expect(createEnzymeAdapterMock).toHaveBeenCalled();
        expect(overwriteEnzymeMountsMock).toHaveBeenCalledWith(
            filePath,
            'testFileWithAdapter.js',
        );
        expect(runJestInChildProcessMock).toHaveBeenCalledWith(
            'testFileWithAdapter.js',
        );
        expect(getDomTreeOutputFromFileMock).toHaveBeenCalled();
    });
});
