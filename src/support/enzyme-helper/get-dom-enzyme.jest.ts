import fs from 'fs';
import * as getDomEnzyme from './get-dom-enzyme';
import { getConfigProperty } from '../config';

// Mocks
jest.mock('fs');
jest.mock('../config', () => ({
    getConfigProperty: jest.fn(),
}));

const {
    overwriteEnzymeMounts,
    getenzymeRenderAdapterCode,
    createEnzymeAdapter,
    runJestDirectly,
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

describe('runJestDirectly', () => {
    it.skip('should create enzyme adapter file with the correct content and path', async () => {
        const output = await runJestDirectly(
            'src/support/enzyme-helper/enzyme-working-file.jest.tsx',
            'jest.config.js',
        );
        console.log('result:', output);
    });
});
