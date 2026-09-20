import { join } from 'path';
import { packageJsonReadBroker } from './brokers/package-json/read/package-json-read-broker';
import { hasPackageJsonDependencyGuard } from './guards/has-package-json-dependency/has-package-json-dependency-guard';
import { hydrationRecipesStatics } from './statics/hydration-recipes/hydration-recipes-statics';

describe('this repo does not ship its own recipes package', () => {
  it("VALID: {root package.json dependencies} => holds no entry for this repo's own recipes package, because dependencies is what ships to every consumer's npm install", () => {
    const rootPackageJsonPath = join(__dirname, '../../..', 'package.json');
    const rootPackageJson = packageJsonReadBroker({ filePath: rootPackageJsonPath });
    const shippedDependencyKey = `@dungeonmaster/${hydrationRecipesStatics.packageName}`;

    const result = hasPackageJsonDependencyGuard({
      packageJson: rootPackageJson,
      dependencyName: shippedDependencyKey,
    });

    expect(result).toBe(false);
  });

  it("VALID: {this package's own package.json} => declares private:true, so npm refuses to publish it even if the root dependency entry comes back", () => {
    const ownPackageJsonPath = join(__dirname, '..', 'package.json');
    const ownPackageJson = packageJsonReadBroker({ filePath: ownPackageJsonPath });

    expect(ownPackageJson.private).toBe(true);
  });
});
