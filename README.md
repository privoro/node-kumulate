# Kumulate
Replacement for [Kustomize](https://kustomize.io/) that focuses on ordering resources such that base nesting is respected. 

### Installation
Kumulate can be installed via NPM.
```
npm install -g @privoro/kumulate
```
### Usage
Call `kumlate build` with a path to a directory containing a `kustomization.yml`.
 
```
kumulate build path/to/kustomization/dir
```

### Feature Parity w/ Kustomize
The following kustomize fields are supported by Kumulate. 

- [x] resources
- [x] bases
- [x] SecretGenerator 
- [x] ConfigMapGenerator
- [ ] commonAnnotations
- [ ] commonLabels
- [ ] namespace
- [ ] namePrefix
- [ ] nameSuffix
- [ ] generatorOptions
- [ ] patchesStrategicMerge
- [ ] patchesJson6902
- [ ] crds
- [ ] vars
- [ ] images

