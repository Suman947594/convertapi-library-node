import fs from 'fs';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ConvertAPI from '../src';

chai.use(chaiAsPromised);

const expect = chai.expect;
const api = ConvertAPI(process.env.CONVERT_API_SECRET);

describe('ConvertAPI', () => {
  it('should assign secret', () => {
    const expectedVal = process.env.CONVERT_API_SECRET;
    expect(api.secret).to.equal(expectedVal);
  });

  it ('should upload file', () => {
    const file = './examples/files/test.pdf';
    const result = api.upload(file);

    return expect(result).to.eventually.have.property('fileId');
  });

  it ('should upload stream', () => {
    const stream = fs.createReadStream('./examples/files/test.pdf');
    const result = api.upload(stream, 'test.pdf');

    return expect(result).to.eventually.have.property('fileId');
  });

  it ('should convert file to pdf', async () => {
    const params = { File: './examples/files/test.docx' };
    const result = await api.convert('pdf', params);

    expect(result.file.url).to.be.a('string');

    const files = await result.saveFiles('/tmp');

    expect(files[0]).to.be.a('string');
  });

  it ('should convert file to pdf with uploaded file', async () => {
    const upload = api.upload('./examples/files/test.docx');
    const params = { File: upload };
    const result = await api.convert('pdf', params);

    expect(result.file.url).to.be.a('string');

    const files = await result.saveFiles('/tmp');

    expect(files[0]).to.be.a('string');
  });

  it ('should convert file url to pdf', async () => {
    const params = { File: 'https://www.w3.org/TR/PNG/iso_8859-1.txt' };
    const result = await api.convert('pdf', params);

    expect(result.file.url).to.be.a('string');

    const files = await result.saveFiles('/tmp');

    expect(files[0]).to.be.a('string');
  });

  it('should convert url to pdf', async () => {
    const params = { Url: 'http://convertapi.com' };
    const result = await api.convert('pdf', params, 'web');

    expect(result.file.url).to.be.a('string');
  });

  it('should zip multiple files', async () => {
    const files = ['./examples/files/test.docx', './examples/files/test.pdf'];
    const params = { Files: files };

    const result = await api.convert('zip', params);

    expect(result.file.url).to.be.a('string');
  });

  it('should perform chained conversion', async () => {
    const params1 = { File: './examples/files/test.docx' };

    const result1Promise = api.convert('pdf', params1);

    const params2 = { Files: result1Promise };

    const result2 = await api.convert('zip', params2);

    expect(result2.file.url).to.be.a('string');
  });

  it('should perform chained conversion with result files', async () => {
    const params1 = { File: './examples/files/test.docx' };

    const result1 = await api.convert('pdf', params1);

    const params2 = { Files: result1.files };

    const result2 = await api.convert('zip', params2);

    expect(result2.file.url).to.be.a('string');
  });

  it('should handle api errors', () => {
    const params = { Url: 'https://www.w3.org/TR/PNG/iso_8859-1.txt' };

    const promise = api.convert('pdf', params, 'web', 600);

    expect(promise).to.be.rejectedWith(/Parameter validation error/);
  });

  it('should handle client errors', () => {
    const fastApi = ConvertAPI(process.env.CONVERT_API_SECRET, { uploadTimeout: 0.0001 });

    const params = { File: './examples/files/test.docx' };

    const promise = fastApi.convert('pdf', params);

    expect(promise).to.be.rejectedWith(/timeout/);
  });

  it('fetches user info', () => {
    const result = api.getUser();

    return expect(result).to.eventually.have.property('SecondsLeft');
  });
});
