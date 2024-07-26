import fs from 'fs';
import { overwriteEnzymeMounts, getenzymeRenderAdapterCode } from '../src/utils/enzyme-helper/get-dom-enzyme';

// Mock the 'fs' module
jest.mock('fs');

describe('overwriteEnzymeMounts', () => {
    const filePath = 'testFile.js';
    const filePathWithEnzymeAdapter = 'testFileWithAdapter.js';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should replace the import statement correctly', async () => {
        const fileContent = "import { mount } from 'enzyme';\nconst a = 1;";
        const expectedContent = "import { mount, shallow } from './enzyme-mount-adapter';\nconst a = 1;";

        // Mock readFileSync to return the file content
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        // Mock writeFileSync
        (fs.writeFileSync as jest.Mock).mockImplementation();

        await overwriteEnzymeMounts(filePath, filePathWithEnzymeAdapter);

        // Check if readFileSync was called with the correct file path
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');

        // Check if writeFileSync was called with the correct arguments
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePathWithEnzymeAdapter, expectedContent, 'utf-8');
    });

    it('should throw an error if no Enzyme imports are detected', async () => {
        const fileContent = "import { somethingElse } from 'some-library';\nconst a = 1;";

        // Mock readFileSync to return the file content
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

        // Mock writeFileSync
        (fs.writeFileSync as jest.Mock).mockImplementation();

        await expect(overwriteEnzymeMounts(filePath, filePathWithEnzymeAdapter)).rejects.toThrow(
            'No Enzyme imports detected. Is this an Enzyme file? Or is it using helper functions that call Enzyme mounting methods?'
        );

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
        expect(actualCode).toContain("import enzyme, { mount as originalMount, shallow as originalShallow } from 'enzyme';");
        expect(actualCode).toContain(`${collectedDomTreeFilePath}`);
    });
});
