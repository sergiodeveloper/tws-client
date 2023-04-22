import { TypeBuilder } from '../src/TypeBuilder';

describe('twsTypesCommand', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('root', async () => {
    jest.spyOn(TypeBuilder, 'main').mockImplementation();

    require('../src/twsTypesCommand');

    expect(TypeBuilder.main).toHaveBeenCalledWith(process.argv);
  });
});
