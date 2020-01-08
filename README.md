# verdaccio-groups

Verdaccio Plugin to handle dynamic groups in package access specification, a king of authorization level over authentication. Inspired from the [verdaccio-groupnames
](https://github.com/deinstapel/verdaccio-groupnames) plugin.

## Installation

```bash
$ npm i -g verdaccio-groups
```

## Configuration

```yaml
# /verdaccio/conf/people.yaml
groups:
  admin:
  - ankitjain28may
  developer:
  - Jack
  - Jon

# config.yaml
auth:
  groups:
    file: /verdaccio/conf/people.yaml
  # Add other authentication plugins here
packages:
  '@*/*':
    access: developer admin
    publish: admin
    unpublish: admin
```

The above configuration will allow access, when the user is a member of the scope of the npm package.
For example, when user `Jack`, member of group `developer`, has only read access to packages in `@*/*` but not the access of publish and unpublish while the user under group `admin` has all the access.
