const createError = require('http-errors');
const fs = require('fs');
const yaml = require('js-yaml');

class DynamicGroupPlugin {
  constructor(config, stuff) {
    this.logger = stuff.logger;
    this.config = config;
    let fileContents = fs.readFileSync(this.config['file'], 'utf8');
    let data = yaml.safeLoad(fileContents);
    const { groups = {} } = data || {};
    this.configGroup = groups || {};
  }

  allow_action(action) {
    const that = this;
    return function (user, pkg, callback) {
      const {
        name: userName,
        groups: userGroups
      } = user;

      // Split pkgName
      const pkgName = pkg.name;
      const isOrgPackage = pkgName.startsWith('@');
      const orgEnd = pkgName.indexOf('/');

      if (isOrgPackage && orgEnd > 0) {
        // scoped package, check for special scoping rules
        // orgName contains the organization name.
        const orgName = pkgName.slice(1, orgEnd);
        // Wildcard group access
        const userHasDirectAccess = userGroups.includes(orgName) && pkg[action].includes('$group');
        if (userHasDirectAccess) {
          // User is in the group named like the package scope, allow it.
          return callback(null, true);
        }
        
        pkg[action].forEach((authGroup, index) => {
          if (that.configGroup.hasOwnProperty(authGroup)) {
            const userList = that.configGroup[authGroup] || [];
            if (userList.includes(userName)) {
              return callback(null, true);
            }
          }
        });
      }

      // Direct group access.
      const hasPermission = pkg[action].some(group => userName === group || userGroups.includes(group));
      if (hasPermission) {
        return callback(null, true);
      }

      if (userName) {
        callback(createError(403, `user ${userName} is not allowed to ${action} package ${pkg.name}`));
      } else {
        callback(createError(401, `authorization required to ${action} package ${pkg.name}`));
      }
    };
  }

  allow_access(user, pkg, callback) {
    this.allow_action('access')(user, pkg, callback);
  }
  allow_publish(user, pkg, callback) {
    this.allow_action('publish')(user, pkg, callback);
  }
  allow_unpublish(user, pkg, callback) {
    const action = 'unpublish';
    const isDefined = pkg[action] === null || pkg[action] === undefined;

    const hasSupport = isDefined ? pkg[action] : false;

    if (hasSupport === false) {
      return callback(null, undefined);
    }
    return this.allow_action(action)(user, pkg, callback);
  }
}

module.exports = (cfg, stuff) => new DynamicGroupPlugin(cfg, stuff);
