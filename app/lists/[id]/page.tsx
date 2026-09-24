"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";

type Contact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
};

type ContactList = {
  id: string;
  name: string;
  killSwitchTag: string | null;
};

export default function ListDetail() {
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importTag, setImportTag] = useState("");
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; updated: number; killSwitchTriggered: number } | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadData() {
    setLoading(true);
    const [listsRes, contactsRes] = await Promise.all([
      fetch("/api/lists"),
      fetch(`/api/contacts?listId=${listId}`),
    ]);
    const listsData = await listsRes.json();
    const contactsData = await contactsRes.json();

    const found = Array.isArray(listsData) ? listsData.find((l: ContactList) => l.id === listId) : null;
    setList(found || null);
    setContacts(Array.isArray(contactsData) ? contactsData : []);
    setLoading(false);
  }

  useEffect(() => {
    if (listId) loadData();
  }, [listId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, tags: tagList, listId }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }