import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, sanitizeText, sanitizeURL } from '../dist/privacy/sanitize.js';
import { StyleRegistry } from '../dist/styles/styleRegistry.js';
import { styleKey } from '../dist/styles/normalizeStyle.js';
import { intersectsViewport } from '../dist/features/geometry.js';
test('whitespace and bounded text',()=>{assert.equal(normalizeText('  hello\n\t world  '),'hello world');assert.equal(normalizeText('123456',3),'123');assert.equal(normalizeText('hidden',0),'')});
test('URL privacy strips credentials/query/hash and dangerous schemes',()=>{
 assert.equal(sanitizeURL('https://user:pw@example.com/path?token=secret#x','https://example.com'),'https://example.com');
 assert.equal(sanitizeURL('/path?q=secret#x','https://example.com','path'),'https://example.com/path');
 for(const url of ['javascript:alert(1)','data:text/html,secret','mailto:me@example.com'])assert.equal(sanitizeURL(url,'https://example.com'),undefined);
});
test('redaction and custom omission',()=>{assert.equal(sanitizeText('me@example.com','name',80,{}),'[email]');assert.equal(sanitizeText('Bearer verysecret','text',240,{}),'[token]');assert.equal(sanitizeText('private','text',240,{redact:()=>undefined}),undefined)});
test('style equality is key-order independent and delimiter-safe',()=>{
 const a={color:'red',display:'block'},b={display:'block',color:'red'},r=new StyleRegistry();
 assert.equal(styleKey(a),styleKey(b));assert.equal(r.intern(a),r.intern(b));
 assert.notEqual(r.intern({a:'b|c',d:'e'}),r.intern({a:'b','c|d':'e'}));a.color='blue';assert.equal(r.styles.s1.color,'red');
});
test('viewport overlap',()=>{const v={width:100,height:100};assert.equal(intersectsViewport({x:-5,y:0,width:10,height:10},v),true);assert.equal(intersectsViewport({x:0,y:100,width:10,height:10},v),false);assert.equal(intersectsViewport({x:0,y:0,width:0,height:10},v),false)});
